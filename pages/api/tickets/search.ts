import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = req.body;

  try {
    // Buscar usuário pelo telefone
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: "not_found",
        msg: "Usuário não encontrado",
      });
    }

    const user = users[0];

    // Buscar order items do usuário
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          quantity,
          numbers,
          price
        ),
        raffles (
          name,
          description,
          image_url
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    return res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return res.status(500).json({ error: errorMessage });
  }
}
