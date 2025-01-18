import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Telefone é obrigatório" });
    }

    // Buscar usuário pelo telefone
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone);

    if (userError) {
      throw userError;
    }

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "error",
        msg: "Nenhum registro encontrado para este telefone",
      });
    }

    const user = users[0];

    // Buscar pedidos do usuário
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        id,
        ref,
        status,
        created_at,
        raffles (
          product_id,
          name
        ),
        order_items (
          quantity,
          numbers
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        status: "error",
        msg: "Nenhum pedido encontrado",
      });
    }

    return res.status(200).json({
      status: "success",
      redirect: `/meus-numeros/${phone}`,
      orders,
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
}
