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

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select(
      `*, pet:pets(nome, especie, porte, cliente:clientes(nome, telefone)),
       agendamento_servicos(agendamento_id, servico_id, servico:servicos(id, nome, tipo, preco, duracao_minutos, ativo))`
    )
    .gte("data_hora", `${dataFiltro}T00:00:00`)
    .lte("data_hora", `${dataFiltro}T23:59:59`)
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
