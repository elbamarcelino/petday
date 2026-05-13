"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export type AgendamentoSemana = { dia: string; total: number };
export type FaturamentoMensal = { mes: string; total: number };
export type ServicoPopular = { nome: string; total: number };

const PIE_COLORS = ["#7c3aed", "#16a34a", "#d97706", "#3b82f6", "#ec4899", "#06b6d4"];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipAgendamentos({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#ddd6fe] rounded-xl px-3 py-2 text-sm shadow">
      <p className="font-semibold text-[#1e1b4b]">{label}</p>
      <p className="text-[#7c3aed]">{payload[0].value} agendamentos</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipFaturamento({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#ddd6fe] rounded-xl px-3 py-2 text-sm shadow">
      <p className="font-semibold text-[#1e1b4b]">{label}</p>
      <p className="text-[#7c3aed]">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function GraficoAgendamentosSemana({ data }: { data: AgendamentoSemana[] }) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border h-full">
      <div className="mb-4">
        <h3 className="font-semibold text-[var(--color-foreground)]">Agendamentos por dia da semana</h3>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 30 dias · excluindo cancelamentos</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<TooltipAgendamentos />} cursor={{ fill: "#ede9fe", radius: 6 }} />
          <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoFaturamentoMensal({ data }: { data: FaturamentoMensal[] }) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border">
      <div className="mb-4">
        <h3 className="font-semibold text-[var(--color-foreground)]">Faturamento mensal</h3>
        <p className="text-xs text-gray-400 mt-0.5">Últimos 6 meses · agendamentos concluídos</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            width={58}
            tickFormatter={(v: number) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
          />
          <Tooltip content={<TooltipFaturamento />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#gradFaturamento)"
            dot={{ fill: "#7c3aed", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const RADIAN = Math.PI / 180;

function PieLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}) {
  if (percent < 0.07) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function GraficoServicosPopulares({ data }: { data: ServicoPopular[] }) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl p-6 shadow-sm border h-full">
      <div className="mb-2">
        <h3 className="font-semibold text-[var(--color-foreground)]">Serviços populares</h3>
        <p className="text-xs text-gray-400 mt-0.5">Total de agendamentos por serviço</p>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Nenhum serviço registrado ainda
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="nome"
              cx="50%"
              cy="44%"
              outerRadius={80}
              labelLine={false}
              label={PieLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, color: "#1e1b4b" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #ddd6fe",
                fontSize: 13,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`${value} agendamentos`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
