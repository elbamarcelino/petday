import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FinanceiroPeriodoFiltro } from '@/components/FinanceiroPeriodoFiltro'
import type { Periodo } from '@/components/FinanceiroPeriodoFiltro'

interface Props {
  searchParams: Promise<{ periodo?: string; inicio?: string; fim?: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDataSimples(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

interface StatProps {
  title: string
  value: string
  icon: string
  valueColor?: string
  sub?: React.ReactNode
}

function StatCard({ title, value, icon, valueColor = 'text-[var(--color-foreground)]', sub }: StatProps) {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--color-muted-foreground)] font-medium truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{value}</p>
          {sub && <div className="mt-1">{sub}</div>}
        </div>
        <span className="text-3xl shrink-0">{icon}</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FinanceiroPage({ searchParams }: Props) {
  const { periodo = 'mes', inicio, fim } = await searchParams
  const periodoValido = (['hoje', 'semana', 'mes', 'mes_anterior', 'custom'] as Periodo[]).includes(periodo as Periodo)
    ? (periodo as Periodo)
    : 'mes'

  const supabase = await createClient()
  const now = new Date()

  // ─── Datas fixas ────────────────────────────────────────────────
  const hojeInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const hojeFim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1)
  const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // ─── Datas do período filtrado ───────────────────────────────────
  let periodoInicio: Date
  let periodoFim: Date

  switch (periodoValido) {
    case 'hoje':
      periodoInicio = hojeInicio
      periodoFim = hojeFim
      break
    case 'semana': {
      const dow = now.getDay()
      const diff = dow === 0 ? -6 : 1 - dow
      periodoInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff)
      periodoFim = hojeFim
      break
    }
    case 'mes_anterior':
      periodoInicio = mesAnteriorInicio
      periodoFim = mesAnteriorFim
      break
    case 'custom':
      periodoInicio = inicio ? new Date(inicio + 'T00:00:00') : mesAtualInicio
      periodoFim = fim ? new Date(fim + 'T23:59:59') : hojeFim
      break
    case 'mes':
    default:
      periodoInicio = mesAtualInicio
      periodoFim = hojeFim
  }

  // ─── Queries paralelas ───────────────────────────────────────────
  const [
    { data: agHoje },
    { data: agMesAtual },
    { data: agMesAnterior },
    { data: agFiltrados },
  ] = await Promise.all([
    supabase
      .from('agendamentos')
      .select('preco_cobrado')
      .eq('status', 'concluido')
      .gte('data_hora', hojeInicio.toISOString())
      .lte('data_hora', hojeFim.toISOString()),

    supabase
      .from('agendamentos')
      .select('preco_cobrado')
      .eq('status', 'concluido')
      .gte('data_hora', mesAtualInicio.toISOString())
      .lte('data_hora', hojeFim.toISOString()),

    supabase
      .from('agendamentos')
      .select('preco_cobrado')
      .eq('status', 'concluido')
      .gte('data_hora', mesAnteriorInicio.toISOString())
      .lte('data_hora', mesAnteriorFim.toISOString()),

    supabase
      .from('agendamentos')
      .select(`
        id, data_hora, preco_cobrado,
        pet:pets(nome, cliente:clientes(nome)),
        agendamento_servicos(servico:servicos(nome))
      `)
      .eq('status', 'concluido')
      .gte('data_hora', periodoInicio.toISOString())
      .lte('data_hora', periodoFim.toISOString())
      .order('data_hora', { ascending: false }),
  ])

  // ─── Cálculos ────────────────────────────────────────────────────
  const totalHoje = (agHoje ?? []).reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const countHoje = agHoje?.length ?? 0
  const ticketHoje = countHoje > 0 ? totalHoje / countHoje : 0

  const totalMesAtual = (agMesAtual ?? []).reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const totalMesAnterior = (agMesAnterior ?? []).reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const variacaoMes = totalMesAnterior > 0
    ? ((totalMesAtual - totalMesAnterior) / totalMesAnterior) * 100
    : null

  const totalPeriodo = (agFiltrados ?? []).reduce((s, a) => s + (a.preco_cobrado ?? 0), 0)
  const countPeriodo = agFiltrados?.length ?? 0
  const ticketPeriodo = countPeriodo > 0 ? totalPeriodo / countPeriodo : 0

  const periodoLabel: Record<Periodo, string> = {
    hoje: 'Hoje',
    semana: 'Esta semana',
    mes: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    mes_anterior: mesAnteriorInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    custom: inicio && fim ? `${fmtDataSimples(inicio)} – ${fmtDataSimples(fim)}` : 'Personalizado',
  }

  const mesAtualLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8 space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Financeiro</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Resumo financeiro do petshop</p>
        </div>
        <Link
          href="/dashboard/financeiro/caixa"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          💵 Caixa do dia
        </Link>
      </div>

      {/* ── Resumo do dia ── */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
          Resumo do dia
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total recebido hoje"
            value={fmt(totalHoje)}
            icon="💰"
            valueColor="text-green-600"
          />
          <StatCard
            title="Atendimentos hoje"
            value={String(countHoje)}
            icon="✅"
            valueColor="text-[var(--color-primary)]"
          />
          <StatCard
            title="Ticket médio hoje"
            value={fmt(ticketHoje)}
            icon="🎟️"
            valueColor="text-indigo-500"
          />
        </div>
      </section>

      {/* ── Resumo do mês ── */}
      <section>
        <h2 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
          Resumo do mês
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title={`Faturamento — ${mesAtualLabel}`}
            value={fmt(totalMesAtual)}
            icon="📈"
            valueColor="text-green-600"
            sub={
              variacaoMes !== null ? (
                <span className={`text-xs font-semibold ${variacaoMes >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {variacaoMes >= 0 ? '▲' : '▼'} {Math.abs(variacaoMes).toFixed(1)}% vs mês anterior
                </span>
              ) : null
            }
          />
          <StatCard
            title={`Mês anterior — ${mesAnteriorInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
            value={fmt(totalMesAnterior)}
            icon="📊"
            valueColor="text-[var(--color-muted-foreground)]"
          />
        </div>
      </section>

      {/* ── Transações ── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <h2 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide pt-1">
            Transações
          </h2>
          <FinanceiroPeriodoFiltro
            key={`${periodoValido}-${inicio}-${fim}`}
            periodoAtivo={periodoValido}
            inicio={inicio}
            fim={fim}
          />
        </div>

        {/* Cards resumo do período filtrado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={`Total — ${periodoLabel[periodoValido]}`}
            value={fmt(totalPeriodo)}
            icon="💰"
            valueColor="text-green-600"
          />
          <StatCard
            title="Atendimentos no período"
            value={String(countPeriodo)}
            icon="✅"
            valueColor="text-[var(--color-primary)]"
          />
          <StatCard
            title="Ticket médio do período"
            value={fmt(ticketPeriodo)}
            icon="🎟️"
            valueColor="text-indigo-500"
          />
        </div>

        {/* Lista de transações */}
        {countPeriodo === 0 ? (
          <div className="bg-[var(--color-card)] rounded-2xl border px-6 py-12 text-center text-[var(--color-muted-foreground)] text-sm">
            Nenhuma transação no período selecionado.
          </div>
        ) : (
          <div className="bg-[var(--color-card)] rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[var(--color-muted)]/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide whitespace-nowrap">
                      Data
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                      Pet
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                      Cliente
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
                      Serviços
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide whitespace-nowrap">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-muted)]/60">
                  {(agFiltrados ?? []).map((ag) => {
                    const pet = ag.pet as unknown as { nome: string; cliente?: { nome: string } | null } | null
                    const servicos = (ag.agendamento_servicos as unknown as { servico?: { nome: string } | null }[])
                      ?.map((as) => as.servico?.nome)
                      .filter(Boolean)
                      .join(', ') || '—'
                    return (
                      <tr
                        key={ag.id}
                        className="hover:bg-[var(--color-muted)]/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="font-medium text-[var(--color-foreground)]">{fmtData(ag.data_hora)}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)]">{fmtHora(ag.data_hora)}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                          {pet?.nome ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                          {pet?.cliente?.nome ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-muted-foreground)] max-w-[200px]">
                          <span className="truncate block">{servicos}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 whitespace-nowrap">
                          {fmt(ag.preco_cobrado)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-[var(--color-muted)]/40">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-[var(--color-foreground)]">
                      Total ({countPeriodo} atendimento{countPeriodo !== 1 ? 's' : ''})
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 whitespace-nowrap">
                      {fmt(totalPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

    </div>
  )
}
