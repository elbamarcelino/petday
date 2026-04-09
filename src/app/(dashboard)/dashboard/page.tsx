import { createClient } from "@/lib/supabase/server";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalClientes },
    { count: totalPets },
    { count: agendamentosHoje },
    { count: agendamentosPendentes },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("pets").select("*", { count: "exact", head: true }),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .gte("data_hora", new Date().toISOString().split("T")[0])
      .lt(
        "data_hora",
        new Date(Date.now() + 86400000).toISOString().split("T")[0]
      ),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
  ]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do seu petshop</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clientes cadastrados"
          value={totalClientes ?? 0}
          icon="👤"
          color="text-[var(--color-primary)]"
        />
        <StatCard
          title="Pets cadastrados"
          value={totalPets ?? 0}
          icon="🐶"
          color="text-indigo-500"
        />
        <StatCard
          title="Agendamentos hoje"
          value={agendamentosHoje ?? 0}
          icon="📅"
          color="text-[var(--color-success)]"
        />
        <StatCard
          title="Pendentes"
          value={agendamentosPendentes ?? 0}
          icon="⏳"
          color="text-[var(--color-warning)]"
        />
      </div>
    </div>
  );
}
