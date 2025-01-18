import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import jwt from "jsonwebtoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Recebendo requisição:", req.method);

  if (req.method !== "POST") {
    console.log("Método não permitido:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = req.body;
  console.log("Telefone recebido:", phone);

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("phone", phone);

    if (error) {
      console.error("Erro ao buscar usuários:", error);
      throw error;
    }

    if (!users || users.length === 0) {
      console.log("Usuário não encontrado para o telefone:", phone);
      return res.status(404).json({
        status: "not_found",
        msg: "Usuário não encontrado",
      });
    }

    const user = users[0];
    console.log("Usuário encontrado:", user);

    // Criar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
      },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "24h" }
    );

    console.log("Token criado com sucesso");
    return res.status(200).json({
      status: "success",
      token: token,
      user: user,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
