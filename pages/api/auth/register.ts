import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import jwt from "jsonwebtoken";

interface User {
  id: string;
  phone: string;
  name: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Corpo da requisição:", req.body);

    // Extrair dados do corpo da requisição
    const { phone, firstname, lastname } = req.body;

    console.log("Dados recebidos:", { phone, firstname, lastname });

    if (!phone || !firstname || !lastname) {
      console.log("Campos faltando:", { phone, firstname, lastname });
      return res.status(400).json({
        error: "Todos os campos são obrigatórios",
        received: { phone, firstname, lastname },
      });
    }

    // Limpar o telefone (remover formatação)
    const cleanPhone = phone.replace(/\D/g, "");
    console.log("Telefone limpo:", cleanPhone);

    // Verificar se usuário já existe
    console.log("Verificando usuário existente...");
    const { data: existingUsers, error: existingError } = (await supabase
      .from("users")
      .select("id")
      .eq("phone", cleanPhone)) as { data: User[] | null; error: any };

    if (existingError) {
      console.error("Erro ao verificar usuário existente:", existingError);
      return res.status(500).json({
        error: "Erro ao verificar usuário existente",
        details: existingError,
      });
    }

    console.log("Usuários existentes:", existingUsers);

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        status: "phone_already",
        msg: "Telefone já cadastrado",
      });
    }

    // Criar novo usuário
    console.log("Criando novo usuário...");
    const { data: newUsers, error: insertError } = (await supabase
      .from("users")
      .insert([
        {
          phone: cleanPhone,
          name: `${firstname} ${lastname}`,
        },
      ])
      .select()) as { data: User[] | null; error: any };

    if (insertError) {
      console.error("Erro ao criar usuário:", insertError);
      return res.status(500).json({
        error: "Erro ao criar usuário",
        details: insertError,
      });
    }

    if (!newUsers || newUsers.length === 0) {
      console.error("Nenhum usuário retornado após inserção");
      return res.status(500).json({
        error: "Erro ao criar usuário",
        details: "Nenhum usuário retornado após inserção",
      });
    }

    const newUser = newUsers[0];
    console.log("Usuário criado:", newUser);

    // Criar token JWT
    const token = jwt.sign(
      {
        userId: newUser.id,
        phone: newUser.phone,
      },
      process.env.JWT_SECRET || "sua-chave-secreta",
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      status: "success",
      token: token,
      user: newUser,
    });
  } catch (error) {
    console.error("Erro completo:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro desconhecido";
    return res.status(500).json({
      error: errorMessage,
      details: JSON.stringify(error, null, 2),
    });
  }
}
