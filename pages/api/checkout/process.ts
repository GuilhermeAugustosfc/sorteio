import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import { createPayment } from "../../../lib/mercadoPago";

interface OrderItem {
  product_id: string;
  quantity: number;
  numbers: string[];
  price: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method);

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method);
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { order_id, payment_method } = req.body;
    console.log("Dados recebidos:", { order_id, payment_method });

    if (!order_id || payment_method !== "pix") {
      console.log("Erro de validação:", {
        order_id,
        payment_method,
      });
      return res.status(400).json({
        error: "ID do pedido e método de pagamento PIX são obrigatórios",
      });
    }

    // Buscar pedido
    console.log("Buscando pedido com ID:", order_id);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          product_id,
          quantity,
          numbers,
          price
        )
      `
      )
      .eq("id", order_id)
      .single();

    if (orderError) {
      console.error("Erro ao buscar pedido:", orderError);
      throw orderError;
    }
    if (!order) {
      console.log("Pedido não encontrado:", order_id);
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Se já existe um pagamento pendente, retorna os dados do PIX
    if (order.payment_status === "pending" && order.pix_code) {
      console.log("Pagamento pendente encontrado, retornando dados do PIX.");
      return res.status(200).json({
        status: "success",
        qr_code_text: order.pix_code,
        qr_code_base64: order.pix_qrcode,
        payment_id: order.payment_id,
      });
    }

    // Calcula valor total
    const totalAmount = order.order_items.reduce(
      (total: number, item: OrderItem) => total + item.price * item.quantity,
      0
    );
    console.log("Valor total calculado:", totalAmount);

    // Cria pagamento no Mercado Pago
    const payment = await createPayment({
      transaction_amount: totalAmount,
      payment_method_id: "pix",
      payer: {
        email: order.email || "customer@email.com",
        first_name: order.name?.split(" ")[0] || "Customer",
        last_name: order.name?.split(" ").slice(1).join(" ") || "Name",
      },
      description: `Compra de ${order.order_items.reduce(
        (total: number, item: OrderItem) => total + item.quantity,
        0
      )} cotas`,
      external_reference: order_id,
    });
    console.log("Pagamento criado com sucesso:", payment);

    // Atualiza pedido com informações do pagamento
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_id: payment.id,
        payment_method: "pix",
        payment_status: "pending",
        pix_code: payment.point_of_interaction.transaction_data.qr_code,
        pix_qrcode:
          payment.point_of_interaction.transaction_data.qr_code_base64,
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Erro ao atualizar pedido:", updateError);
      throw updateError;
    }

    // Retorna dados do PIX
    console.log("Retornando dados do PIX.");
    return res.status(200).json({
      status: "success",
      qr_code_text: payment.point_of_interaction.transaction_data.qr_code,
      qr_code_base64:
        payment.point_of_interaction.transaction_data.qr_code_base64,
      payment_id: payment.id,
      redirect_url: `/compra.html?ref=${order.ref}&order_id=${order.id}`,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return res.status(500).json({
      error: "Erro ao processar pagamento",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}
