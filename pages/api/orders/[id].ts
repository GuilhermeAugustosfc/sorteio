import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import jwt from "jsonwebtoken";

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  numbers: string[];
  created_at: Date;
  product: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
  };
}

interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  user_id: string;
  ref: string;
  status: string;
  payment_method: string | null;
  payment_id: string | null;
  payment_status: string | null;
  total: number;
  created_at: Date;
  pix_code: string | null;
  pix_qrcode: string | null;
  paid_at: Date | null;
  email: string | null;
  quantity: number;
  notes: string | null;
  order_items: OrderItem[];
  user: User | null; // Adicionando a informação do usuário
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ status: "error", message: "Método não permitido" });
  }

  try {
    // Pegar o token do header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ status: "error", message: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "sua-chave-secreta";

    // Verificar o token
    const decoded = jwt.verify(token, secret) as { userId: string };
    if (!decoded.userId) {
      return res
        .status(401)
        .json({ status: "error", message: "Token inválido" });
    }

    // Pegar o ID da ordem da URL
    const { id } = req.query;

    // Buscar a ordem no Supabase
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          raffle:product_id (
            product_id,
            name,
            description,
            image_url
          )
        ),
        users (
          id,
          phone,
          name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (orderError) {
      console.error("Erro ao buscar ordem:", orderError);
      return res
        .status(500)
        .json({ status: "error", message: "Erro ao buscar ordem" });
    }

    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Ordem não encontrada" });
    }

    // Verificar se a ordem pertence ao usuário
    if (order.user_id !== decoded.userId) {
      return res
        .status(403)
        .json({ status: "error", message: "Acesso negado" });
    }

    // Retornar os dados da ordem
    return res.status(200).json({
      status: "success",
      order: {
        id: order.id,
        user_id: order.user_id,
        ref: order.ref,
        status: order.status,
        payment_method: order.payment_method,
        payment_id: order.payment_id,
        payment_status: order.payment_status,
        total: order.total,
        created_at: order.created_at,
        pix_code: order.pix_code,
        pix_qrcode: order.pix_qrcode,
        paid_at: order.paid_at,
        email: order.email,
        quantity: order.quantity,
        notes: order.notes,
        order_items: order.order_items.map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          numbers: item.numbers,
          created_at: item.created_at,
          product: item.raffle
            ? {
                id: item.raffle.product_id,
                name: item.raffle.name,
                description: item.raffle.description,
                image_url: item.raffle.image_url,
              }
            : null,
        })),
        user: {
          id: order.users.id,
          phone: order.users.phone,
          name: order.users.name,
          email: order.users.email,
        }, // Adicionando as informações do usuário
      } as Order,
    });
  } catch (error) {
    console.error("Erro ao buscar ordem:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Erro interno do servidor" });
  }
}
