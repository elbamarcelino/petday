import { createClient } from "@/lib/supabase/server";
import {
  GraficoAgendamentosSemana,
  GraficoFaturamentoMensal,
  GraficoServicosPopulares,
} from "@/components/DashboardCharts";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  sub?: string;
}

function StatCard({ title, value, icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split("T")[0];

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: totalClientes },
    { count: totalPets },
    { count: agendamentosHoje },
    { count: agendamentosPendentes },
    { data: rawRecentes },
    { data: rawConcluidosMeses },
    { data: rawServicos },
    { data: rawDoMes },
    { data: rawComPet },
  ] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase.from("pets").select("*", { count: "exact", head: true }),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .gte("data_hora", todayStr)
      .lt("data_hora", tomorrowStr),
    supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    // Bar chart: agendamentos por dia da semana (últimos 30 dias)
    supabase
      .from("agendamentos")
      .select("data_hora")
      .gte("data_hora", thirtyDaysAgo.toISOString())
      .neq("status", "cancelado"),
    // Area chart: faturamento por mês (últimos 6 meses)
    supabase
      .from("agendamentos")
      .select("data_hora, preco_cobrado")
      .gte("data_hora", sixMonthsStart.toISOString())
      .eq("status", "concluido"),
    // Pie chart: serviços populares
    supabase
      .from("agendamento_servicos")
      .select("servico:servicos(nome)"),
    // Card: total do mês
    supabase
      .from("agendamentos")
      .select("preco_cobrado")
      .gte("data_hora", startOfMonth.toISOString())
      .eq("status", "concluido"),
    // Card: taxa de retorno (últimos 90 dias)
    supabase
      .from("agendamentos")
      .select("pet:pets(cliente_id)")
      .gte("data_hora", ninetyDaysAgo.toISOString())
      .neq("status", "cancelado"),
  ]);

  // --- Agendamentos por dia da semana ---
  const diasNomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const contagemDia = [0, 0, 0, 0, 0, 0, 0];
  (rawRecentes ?? []).forEach((a: { data_hora: string }) => {
    contagemDia[new Date(a.data_hora).getDay()]++;
  });
  const agendamentosSemana = diasNomes.map((dia, i) => ({ dia, total: contagemDia[i] }));

  // --- Faturamento por mês ---
  const mesesLabels: Record<string, string> = {};
  const faturamentoPorMes: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    faturamentoPorMes[key] = 0;
    mesesLabels[key] = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  }
  (rawConcluidosMeses ?? []).forEach(
    (a: { data_hora: string; preco_cobrado: number }) => {
      const d = new Date(a.data_hora);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in faturamentoPorMes) faturamentoPorMes[key] += a.preco_cobrado ?? 0;
    }
  );
  const faturamentoMensal = Object.entries(faturamentoPorMes).map(([key, total]) => ({
    mes: mesesLabels[key],
    total,
  }));

  // --- Serviços populares ---
  const contagemServicos: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rawServicos ?? []).forEach((row: any) => {
    const nome: string | null = row.servico?.nome ?? null;
    if (nome) contagemServicos[nome] = (contagemServicos[nome] ?? 0) + 1;
  });
  const servicosPopulares = Object.entries(contagemServicos)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // --- Cards financeiros ---
  const totalMes =
    (rawDoMes ?? []).reduce(
      (sum: number, a: { preco_cobrado: number }) => sum + (a.preco_cobrado ?? 0),
      0
    );

  const somaConcluidosMeses = (rawConcluidosMeses ?? []).reduce(
    (sum: number, a: { preco_cobrado: number }) => sum + (a.preco_cobrado ?? 0),
    0
  );
  const countConcluidosMeses = rawConcluidosMeses?.length ?? 0;
  const ticketMedio = countConcluidosMeses > 0 ? somaConcluidosMeses / countConcluidosMeses : 0;

  const clienteContagem: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (rawComPet ?? []).forEach((a: any) => {
    const id: string | null = a.pet?.cliente_id ?? null;
    if (id) clienteContagem[id] = (clienteContagem[id] ?? 0) + 1;
  });
  const totalClientesAtivos = Object.keys(clienteContagem).length;
  const clientesRetornaram = Object.values(clienteContagem).filter((c) => c > 1).length;
  const taxaRetorno =
    totalClientesAtivos > 0
      ? Math.round((clientesRetornaram / totalClientesAtivos) * 100)
      : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do seu petshop</p>
      </div>

      {/* Cards operacionais */}
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

      {/* Cards financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Faturamento do mês"
          value={formatCurrency(totalMes)}
          icon="💰"
          color="text-[var(--color-success)]"
          sub="Agendamentos concluídos"
        />
        <StatCard
          title="Ticket médio"
          value={formatCurrency(ticketMedio)}
          icon="🎟️"
          color="text-[var(--color-primary)]"
          sub="Últimos 6 meses"
        />
        <StatCard
          title="Taxa de retorno"
          value={`${taxaRetorno}%`}
          icon="🔄"
          color="text-indigo-500"
          sub="Clientes recorrentes (90 dias)"
        />
      </div>

      {/* Gráficos — linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GraficoAgendamentosSemana data={agendamentosSemana} />
        </div>
        <div>
          <GraficoServicosPopulares data={servicosPopulares} />
        </div>
      </div>

      {/* Gráfico — faturamento mensal */}
      <GraficoFaturamentoMensal data={faturamentoMensal} />
    </div>
  );
}
