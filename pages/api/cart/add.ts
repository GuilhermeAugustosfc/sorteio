import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

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
    // Verificar token JWT
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    // Decodificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "sua-chave-secreta"
    ) as { userId: string };
    if (!decoded.userId) {
      return res.status(401).json({ error: "Token inválido" });
    }

    let { product_id, qty } = req.body;
    // Converter qty para número
    qty = parseInt(qty);

    console.log("Dados recebidos:", { product_id, qty });

    if (!product_id || !qty) {
      console.log("Campos faltando:", { product_id, qty });
      return res
        .status(400)
        .json({ error: "ID do produto e quantidade são obrigatórios" });
    }

    // Verificar se o produto existe e está disponível
    console.log("Verificando produto com ID:", product_id);
    const { data: product, error: productError } = await supabase
      .from("raffles")
      .select("*")
      .eq("product_id", product_id)
      .single();

    if (productError) {
      console.error("Erro ao verificar produto:", productError);
      throw productError;
    }

    if (!product) {
      console.log("Produto não encontrado:", product_id);
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Verificar se há cotas disponíveis
    console.log("Verificando cotas disponíveis para o produto:", product_id);
    const { data: raffle, error: raffleError } = await supabase
      .from("raffles")
      .select("cotas_disponiveis, cotas_reservadas, price")
      .eq("product_id", product_id)
      .single();

    if (raffleError) {
      console.error("Erro ao verificar cotas:", raffleError);
      throw raffleError;
    }

    if (!raffle || raffle.cotas_disponiveis < qty) {
      console.log("Quantidade de cotas indisponível:", {
        cotas_disponiveis: raffle?.cotas_disponiveis,
        requested_qty: qty,
      });
      return res.status(400).json({
        status: "error",
        msg: "Quantidade de cotas indisponível",
      });
    }

    // Atualizar cotas reservadas
    console.log("Atualizando cotas reservadas para o produto:", product_id);
    const { error: updateError } = await supabase
      .from("raffles")
      .update({
        cotas_reservadas: parseInt(raffle.cotas_reservadas) + parseInt(qty),
        cotas_disponiveis: parseInt(raffle.cotas_disponiveis) - parseInt(qty),
      })
      .eq("product_id", product_id);

    if (updateError) {
      console.error("Erro ao atualizar cotas:", updateError);
      throw updateError;
    }

    // Criar pedido diretamente
    const orderRef = uuidv4().split("-")[0];
    const total = parseInt(qty) * raffle.price;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: decoded.userId,
        ref: orderRef,
        status: "pending",
        payment_status: "pending",
        total: total,
        quantity: parseInt(qty),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Erro ao criar pedido:", orderError);
      throw orderError;
    }

    const { error: itemsError } = await supabase.from("order_items").insert({
      order_id: order.id,
      product_id: product_id,
      quantity: parseInt(qty),
      price: raffle.price,
    });

    if (itemsError) {
      console.error("Erro ao criar itens do pedido:", itemsError);
      throw itemsError;
    }

    console.log("Pedido criado com sucesso:", order);
    return res.status(200).json({
      status: "success",
      order: order,
    });
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    return res.status(500).json({ error: "Erro ao adicionar ao carrinho" });
  }
}
