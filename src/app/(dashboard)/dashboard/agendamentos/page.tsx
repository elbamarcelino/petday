import { createClient } from "@/lib/supabase/server";
import { AgendamentosClient } from "@/components/AgendamentosClient";
import type { Agendamento, Pet, Servico, Cliente } from "@/types";

export default async function AgendamentosPage() {
  const supabase = await createClient();

  const [{ data: agendamentos }, { data: pets }, { data: servicos }] =
    await Promise.all([
      supabase
        .from("agendamentos")
        .select(
          `*, pet:pets(nome, especie, porte, cliente:clientes(nome, telefone)),
           agendamento_servicos(agendamento_id, servico_id, servico:servicos(id, nome, tipo, preco, duracao_minutos, ativo))`
        )
        .order("data_hora", { ascending: true }),
      supabase
        .from("pets")
        .select("*, cliente:clientes(nome, telefone)")
        .order("nome", { ascending: true }),
      supabase
        .from("servicos")
        .select("*")
        .order("nome", { ascending: true }),
    ]);

  return (
    <div className="p-8">
      <AgendamentosClient
        agendamentos={(agendamentos as Agendamento[]) ?? []}
        pets={(pets as (Pet & { cliente?: Pick<Cliente, "nome" | "telefone"> })[]) ?? []}
        servicos={(servicos as Servico[]) ?? []}
      />
    </div>
  );
}
