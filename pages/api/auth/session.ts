import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";
import { serialize } from "cookie";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // Login/Criar sessão
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: "ID do usuário é obrigatório" });
      }

      // Criar sessão usando o cliente do Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.signInWithPassword({
        email: user_id + "@temp.com",
        password: user_id,
      });

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error("Erro ao criar sessão");
      }

      // Configurar cookie de sessão
      const sessionCookie = serialize("session_token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      res.setHeader("Set-Cookie", sessionCookie);

      return res.status(200).json({
        status: "success",
        session: session,
      });
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      return res.status(500).json({ error: "Erro ao criar sessão" });
    }
  } else if (req.method === "GET") {
    // Verificar sessão atual
    try {
      const supabaseServerClient = createServerSupabaseClient({ req, res });
      const {
        data: { session },
        error,
      } = await supabaseServerClient.auth.getSession();

      if (error || !session) {
        return res.status(401).json({
          status: "error",
          message: "Sessão inválida",
        });
      }

      return res.status(200).json({
        status: "success",
        session: session,
      });
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      return res.status(500).json({ error: "Erro ao verificar sessão" });
    }
  } else if (req.method === "DELETE") {
    // Logout/Destruir sessão
    try {
      res.setHeader("Set-Cookie", [
        serialize("session_token", "", {
          maxAge: -1,
          path: "/",
        }),
      ]);

      return res.status(200).json({
        status: "success",
        message: "Sessão finalizada",
      });
    } catch (error) {
      console.error("Erro ao finalizar sessão:", error);
      return res.status(500).json({ error: "Erro ao finalizar sessão" });
    }
  } else {
    return res.status(405).json({ error: "Método não permitido" });
  }
}
