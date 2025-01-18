import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import { Ticket } from "../../../types";

interface Order {
  id: string;
  user_id: string;
  raffle_id: string;
  quantity: number;
  total_price: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, raffle_id, quantity } = req.body;

  try {
    // Buscar informações da rifa
    const { data: raffles, error: raffleError } = await supabase
      .from("raffles")
      .select("*")
      .eq("id", raffle_id);

    if (raffleError) throw raffleError;

    if (!raffles || raffles.length === 0) {
      return res.status(404).json({ error: "Rifa não encontrada" });
    }

    const raffle = raffles[0];

    // Calcular preço total
    const total_price = quantity * raffle.price;

    // Criar pedido
    const { data: orders, error: orderError } = (await supabase
      .from("orders")
      .insert([
        {
          user_id,
          raffle_id,
          quantity,
          total_price,
        },
      ])
      .select()) as { data: Order[] | null; error: any };

    if (orderError) throw orderError;

    if (!orders || orders.length === 0) {
      throw new Error("Erro ao criar pedido");
    }

    const order = orders[0];

    // Gerar números aleatórios únicos
    const orderItems = [];
    for (let i = 0; i < quantity; i++) {
      const number = generateUniqueNumber();
      orderItems.push({
        order_id: order.id,
        product_id: raffle_id,
        quantity: 1,
        price: raffle.price,
        numbers: [number],
      });
    }

    // Inserir order items
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) throw orderItemsError;

    return res.status(200).json({
      status: "success",
      data: {
        order,
        orderItems: orderItemsData,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return res.status(500).json({ error: errorMessage });
  }
}

function generateUniqueNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
