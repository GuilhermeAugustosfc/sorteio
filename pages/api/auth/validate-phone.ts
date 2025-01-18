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

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("phone", phone);

    if (error) {
      throw error;
    }

    // Verifica se encontrou algum usuário
    const exists = data && data.length > 0;

    return res.status(200).json({
      exists,
      message: exists ? "Telefone já cadastrado" : "Telefone disponível",
    });
  } catch (error) {
    console.error("Erro ao validar telefone:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
