import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function GET(request: NextRequest) {
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

  return Response.json({
    data: new Date().toISOString(),
    agendamentos_encontrados: agendamentos.length,
    agendamentos,
  });
}
