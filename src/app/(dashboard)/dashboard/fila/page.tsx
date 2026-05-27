import { createClient } from "@/lib/supabase/server";
import { FilaKanbanClient } from "@/components/FilaKanbanClient";
import type { Agendamento } from "@/types";

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function FilaPage({ searchParams }: Props) {
  const { data: dataParam } = await searchParams;

  const hoje = new Date();
  const dataFiltro =
    dataParam ||
    `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  const supabase = await createClient();

  // Brasília é UTC-3: meia-noite local = 03:00 UTC
  const [y, m, d] = dataFiltro.split("-").map(Number)
  const inicioDia = new Date(Date.UTC(y, m - 1, d, 3, 0, 0))       // 00:00 BRT
  const fimDia    = new Date(Date.UTC(y, m - 1, d + 1, 3, 0, 0))   // 00:00 BRT do dia seguinte

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      `*, pet:pets(nome, especie, porte, cliente:clientes(nome, telefone)),
       agendamento_servicos(agendamento_id, servico_id, servico:servicos(id, nome, tipo, preco, duracao_minutos, ativo))`
    )
    .gte("data_hora", inicioDia.toISOString())
    .lt("data_hora", fimDia.toISOString())
    .order("data_hora", { ascending: true });

  return (
    <div className="h-screen overflow-hidden flex flex-col p-8">
      <FilaKanbanClient
        agendamentos={(agendamentos as Agendamento[]) ?? []}
        dataAtual={dataFiltro}
      />
    </div>
  );
}
