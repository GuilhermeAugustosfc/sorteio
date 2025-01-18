import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import { getPayment } from "../../../lib/mercadoPago";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { order_ref } = req.body;

    if (!order_ref) {
      return res
        .status(400)
        .json({ error: "Referência do pedido é obrigatória" });
    }

    // Busca o pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          raffle:product_id (
            product_id,
            name
          )
        )
      `
      )
      .eq("id", order_ref)
      .single();

    if (orderError) throw orderError;
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Se já estiver pago, retorna sucesso
    if (order.payment_status === "paid") {
      return res.status(200).json({
        status: "success",
        order: {
          status: "paid",
        },
      });
    }

    // Verifica status no Mercado Pago
    const payment = await getPayment(order.payment_id);

    if (payment.status === "approved") {
      // Atualiza status do pedido
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Atualiza status das cotas para cada item do pedido
      for (const item of order.order_items) {
        const { error: raffleError } = await supabase.rpc(
          "update_raffle_quotas",
          {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          }
        );

        if (raffleError) throw raffleError;
      }

      return res.status(200).json({
        status: "success",
        order: {
          status: "paid",
        },
      });
    }

    // Se ainda não foi pago
    return res.status(200).json({
      status: "success",
      order: {
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return res.status(500).json({
      error: "Erro ao verificar status do pagamento",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}
