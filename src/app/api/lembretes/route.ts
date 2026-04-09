import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Converte telefone BR para formato E.164 com DDI 55
function formatarTelefoneZAPI(telefone: string): string | null {
  const digits = telefone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13))
    return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

// Busca agendamentos com status 'concluido' cuja data_hora foi há exatamente 30 dias.
// Usa data_hora como referência pois o schema não registra quando o status foi alterado.
async function buscarAgendamentosParaLembrete() {
  const supabase = createAdminClient();

  const referencia = new Date();
  referencia.setDate(referencia.getDate() - 30);

  const inicio = new Date(referencia);
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(referencia);
  fim.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("agendamentos")
    .select(
      `
      id,
      data_hora,
      pet:pets (
        nome,
        cliente:clientes ( nome, telefone )
      )
    `
    )
    .eq("status", "concluido")
    .gte("data_hora", inicio.toISOString())
    .lte("data_hora", fim.toISOString());

  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);

  return data ?? [];
}

type ResultadoEnvio =
  | { id: string; status: "enviado"; telefone: string }
  | { id: string; status: "erro"; motivo: string };

async function enviarLembrete(
  agendamentoId: string,
  nomePet: string,
  nomeDono: string,
  telefone: string
): Promise<ResultadoEnvio> {
  const telefoneFormatado = formatarTelefoneZAPI(telefone);
  if (!telefoneFormatado) {
    return {
      id: agendamentoId,
      status: "erro",
      motivo: `Telefone inválido: "${telefone}"`,
    };
  }

  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token || !clientToken) {
    return {
      id: agendamentoId,
      status: "erro",
      motivo: "Credenciais Z-API não configuradas.",
    };
  }

  const mensagem =
    `Olá, ${nomeDono}! 🐾 Já faz 30 dias desde o último banho do ${nomePet}. ` +
    `Que tal agendar o próximo? Entre em contato conosco para garantir a higiene e o bem-estar do seu pet! 😊`;

  const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  let response: Response;
  try {
    response = await fetch(zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": clientToken,
      },
      body: JSON.stringify({ phone: telefoneFormatado, message: mensagem }),
    });
  } catch (err) {
    return {
      id: agendamentoId,
      status: "erro",
      motivo: `Falha de rede: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      id: agendamentoId,
      status: "erro",
      motivo: `Z-API ${response.status}: ${body}`,
    };
  }

  return { id: agendamentoId, status: "enviado", telefone: telefoneFormatado };
}

export async function GET(request: NextRequest) {
  // Proteção básica: token via header ou query string
  const secret =
    request.headers.get("x-lembretes-secret") ??
    request.nextUrl.searchParams.get("secret");

  if (!process.env.LEMBRETES_SECRET || secret !== process.env.LEMBRETES_SECRET) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let agendamentos: Awaited<ReturnType<typeof buscarAgendamentosParaLembrete>>;
  try {
    agendamentos = await buscarAgendamentosParaLembrete();
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  const resultados: ResultadoEnvio[] = [];

  for (const ag of agendamentos) {
    // O Supabase retorna joins como objeto, mas o tipo inferido pode variar
    const pet = ag.pet as
      | { nome: string; cliente?: { nome?: string; telefone?: string } | null }
      | null;

    const nomePet = pet?.nome ?? "seu pet";
    const nomeDono = (pet?.cliente?.nome ?? "Tutor").split(" ")[0];
    const telefone = pet?.cliente?.telefone ?? "";

    const resultado = await enviarLembrete(ag.id, nomePet, nomeDono, telefone);
    resultados.push(resultado);
  }

  const enviados = resultados.filter((r) => r.status === "enviado").length;
  const erros = resultados.filter((r) => r.status === "erro").length;

  return Response.json({
    data: new Date().toISOString(),
    agendamentos_encontrados: agendamentos.length,
    enviados,
    erros,
    resultados,
  });
}
