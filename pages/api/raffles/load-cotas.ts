import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../../lib/supabaseClient";

interface Cota {
  numero: string;
  valor: string;
  tipo: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { product_id, cotas_premiadas, cotas_array, quantidade_auto_cota } =
      req.body;

    if (!product_id) {
      return res.status(400).json({ error: "ID do produto é obrigatório" });
    }

    // Buscar cotas do produto no banco
    const { data: cotas, error } = await supabase
      .from("raffles")
      .select("cotas_disponiveis, cotas_reservadas")
      .eq("product_id", product_id);

    if (error) {
      throw error;
    }

    if (!cotas || cotas.length === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const cotasInfo = cotas[0];

    // Processar cotas premiadas
    const cotasPremiadas = cotas_premiadas.split(",");
    const cotasArray: Cota[] = cotas_array.split(",").map((cota: string) => {
      const [numero, valor, tipo] = cota.split(":");
      return { numero, valor, tipo };
    });

    // Montar HTML das cotas (similar ao PHP)
    let html = "";
    cotasArray.forEach((cota: Cota) => {
      const isPremium = cotasPremiadas.includes(cota.numero);
      html += `
        <div class="cota ${isPremium ? "premium" : "normal"}">
          <span class="numero">${cota.numero}</span>
          <span class="valor">R$ ${cota.valor}</span>
          ${isPremium ? '<span class="badge-premium">Premiada</span>' : ""}
        </div>
        <div class="hr"></div>
      `;
    });

    return res.status(200).json({
      html,
      cotas_disponiveis: cotasInfo.cotas_disponiveis,
      cotas_reservadas: cotasInfo.cotas_reservadas,
    });
  } catch (error) {
    console.error("Erro ao carregar cotas:", error);
    return res.status(500).json({ error: "Erro ao carregar cotas" });
  }
}
