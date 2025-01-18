import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import { getPayment } from "../../../lib/mercadoPago";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("🔔 Webhook do Mercado Pago recebido:", {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  if (req.method !== "POST") {
    console.log("❌ Método inválido:", req.method);
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Verifica se é uma notificação válida do Mercado Pago
    const { action, data, type } = req.body;
    console.log("📦 Dados recebidos:", { action, data, type });

    // Aceita tanto eventos de teste quanto de pagamento
    if (action === "test.created") {
      console.log("✅ Evento de teste recebido com sucesso!");
      return res.status(200).json({ status: "test_received" });
    }

    if (action !== "payment.updated" || !data.id) {
      console.log("❌ Notificação inválida:", { action, data });
      return res.status(400).json({ error: "Notificação inválida" });
    }

    // Busca os detalhes do pagamento
    console.log("🔍 Buscando detalhes do pagamento:", data.id);
    const payment = await getPayment(data.id);
    console.log("💰 Detalhes do pagamento:", payment);

    if (!payment || !payment.external_reference) {
      console.log("❌ Pagamento não encontrado ou sem referência:", {
        payment,
      });
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    // Se o pagamento foi aprovado
    if (payment.status === "approved") {
      console.log("✅ Pagamento aprovado, buscando pedido...");
      // Busca o pedido pelo external_reference (ref)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", payment.external_reference)
        .single();

      if (orderError || !order) {
        console.log("❌ Erro ao buscar pedido:", { orderError, order });
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      // Se o pedido já estiver pago, ignora
      if (order.payment_status === "paid") {
        console.log("ℹ️ Pedido já processado anteriormente:", order);
        return res.status(200).json({ status: "already_processed" });
      }

      console.log("📝 Atualizando status do pedido...");
      // Atualiza status do pedido

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // Buscar todos os números já utilizados em pedidos pagos
      const { data: existingNumbers, error: numbersError } = await supabase
        .from("order_items")
        .select(
          `
          numbers,
          orders!inner(payment_status)
        `
        )
        .eq("orders.payment_status", "paid");

      if (numbersError) {
        console.log("❌ Erro ao buscar números existentes:", numbersError);
        throw numbersError;
      }

      // Criar conjunto de números existentes para busca rápida
      const usedNumbers = new Set(
        existingNumbers?.flatMap(
          (item: { numbers: string[] }) => item.numbers || []
        )
      );

      // Gerar novos números únicos
      const numbers: string[] = [];
      while (numbers.length < order.quantity) {
        const newNumber = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        if (!usedNumbers.has(newNumber)) {
          numbers.push(newNumber);
          usedNumbers.add(newNumber); // Adiciona ao conjunto para evitar duplicatas na mesma geração
        }
      }

      const { error: updateItemsError } = await supabase
        .from("order_items")
        .update({
          numbers: numbers,
        })
        .eq("order_id", order.id);

      if (updateError) {
        console.log("❌ Erro ao atualizar pedido:", updateError);
        throw updateError;
      }

      if (updateItemsError) {
        console.log("❌ Erro ao atualizar itens do pedido:", updateItemsError);
        throw updateItemsError;
      }

      console.log("🎲 Atualizando cotas do sorteio...");
      // Atualiza status das cotas
      const { error: raffleError } = await supabase.rpc(
        "update_raffle_quotas",
        {
          p_product_id: order.product_id,
          p_quantity: order.quantity,
        }
      );

      if (raffleError) {
        console.log("❌ Erro ao atualizar cotas:", raffleError);
        throw raffleError;
      }

      console.log("✨ Processamento concluído com sucesso!");
      return res.status(200).json({ status: "success" });
    }

    console.log("ℹ️ Status do pagamento:", payment.status);
    // Para outros status, apenas confirma recebimento
    return res.status(200).json({ status: "notification_received" });
  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return res.status(500).json({
      error: "Erro ao processar notificação",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}
