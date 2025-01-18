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
    const { data: users, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("phone", phone);

    if (error) {
      throw error;
    }

    // Se não encontrou usuário ou a lista está vazia
    if (!users || users.length === 0) {
      return res.status(200).json({
        exists: false,
        shouldRegister: true,
        message: "Usuário não encontrado",
      });
    }

    // Pega o primeiro usuário encontrado
    const user = users[0];

    return res.status(200).json({
      exists: true,
      shouldRegister: false,
      user: {
        id: user.id,
        name: user.name,
      },
      message: "Usuário encontrado",
    });
  } catch (error) {
    console.error("Erro ao verificar telefone:", error);
    return res.status(500).json({ error: "Erro ao verificar telefone" });
  }
}
