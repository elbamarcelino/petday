'use client'

import { useState, useEffect, useCallback } from 'react'

type StatusAgendamento = 'pendente' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'

interface AgendamentoAcompanhamento {
  id: string
  data_hora: string
  status: StatusAgendamento
  preco_cobrado: number
  pet: { nome: string } | null
  agendamento_servicos: { servico: { nome: string } | null }[]
}

const STATUS_CONFIG: Record<
  StatusAgendamento,
  { label: string; msg: string; cardBg: string; border: string; badge: string; dot: string }
> = {
  pendente: {
    label: 'Aguardando',
    msg: 'Seu pet está aguardando atendimento.',
    cardBg: 'bg-yellow-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-400',
  },
  confirmado: {
    label: 'Confirmado',
    msg: 'Agendamento confirmado! Seu pet está na fila.',
    cardBg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-400',
  },
  em_andamento: {
    label: 'Em atendimento',
    msg: 'Seu pet está sendo atendido agora! 🛁',
    cardBg: 'bg-purple-50',
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-800',
    dot: 'bg-purple-500',
  },
  concluido: {
    label: 'Concluído',
    msg: 'Prontinho! Pode vir buscar seu pet. 🐾',
    cardBg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-500',
  },
  cancelado: {
    label: 'Cancelado',
    msg: 'Este agendamento foi cancelado.',
    cardBg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-400',
  },
}

function formatarTelefone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface Props {
  slug: string
  petshopNome: string
}

export function AcompanharClient({ slug, petshopNome }: Props) {
  const [fase, setFase] = useState<'input' | 'lista'>('input')
  const [telefone, setTelefone] = useState('')
  const [agendamentos, setAgendamentos] = useState<AgendamentoAcompanhamento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ultimaAtt, setUltimaAtt] = useState<Date | null>(null)

  const buscar = useCallback(
    async (tel: string, showLoading = true) => {
      const digits = tel.replace(/\D/g, '')
      if (digits.length < 10) return

      if (showLoading) setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/acompanhar?slug=${slug}&telefone=${digits}`)
        const json = await res.json()

        if (!res.ok) {
          setError(json.error ?? 'Erro ao buscar agendamentos.')
          return
        }

        setAgendamentos(json.agendamentos ?? [])
        setUltimaAtt(new Date())

        if (showLoading) setFase('lista')
      } catch {
        setError('Não foi possível conectar. Tente novamente.')
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [slug],
  )

  // Auto-refresh a cada 30s enquanto na fase lista
  useEffect(() => {
    if (fase !== 'lista') return
    const interval = setInterval(() => buscar(telefone, false), 30_000)
    return () => clearInterval(interval)
  }, [fase, telefone, buscar])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    buscar(telefone, true)
  }

  function voltar() {
    setFase('input')
    setAgendamentos([])
    setError('')
    setUltimaAtt(null)
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] px-4 py-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span className="text-2xl">🐾</span>
          <div>
            <p className="font-bold text-[var(--color-foreground)] leading-tight">{petshopNome}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Acompanhe seu pet</p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full">
        {/* ── Fase: input de telefone ── */}
        {fase === 'input' && (
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
              Acompanhe seu pet
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-6">
              Digite seu telefone para ver o status do atendimento de hoje.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(99) 99999-9999"
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || telefone.replace(/\D/g, '').length < 10}
                className="w-full py-3.5 rounded-xl font-semibold text-white bg-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Ver meus agendamentos'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Fase: lista de agendamentos ── */}
        {fase === 'lista' && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl font-bold text-[var(--color-foreground)]">
                Agendamentos de hoje
              </h1>
              <button
                onClick={voltar}
                className="text-xs text-[var(--color-primary)] font-medium hover:underline"
              >
                Trocar telefone
              </button>
            </div>

            {ultimaAtt && (
              <p className="text-xs text-[var(--color-muted-foreground)] mb-5">
                Atualizado às{' '}
                {ultimaAtt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {' · '}atualiza a cada 30s
              </p>
            )}

            {agendamentos.length === 0 ? (
              <div className="bg-white border border-[var(--color-border)] rounded-2xl px-6 py-12 text-center">
                <span className="text-4xl block mb-3">🔍</span>
                <p className="font-semibold text-[var(--color-foreground)] mb-1">
                  Nenhum agendamento encontrado
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Não encontramos agendamentos para hoje com este telefone.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {agendamentos.map((ag) => {
                  const cfg = STATUS_CONFIG[ag.status] ?? STATUS_CONFIG.pendente
                  const horario = new Date(ag.data_hora).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  const servicos =
                    ag.agendamento_servicos
                      .map((as) => as.servico?.nome)
                      .filter(Boolean)
                      .join(', ') || '—'

                  return (
                    <div
                      key={ag.id}
                      className={`rounded-2xl border-2 ${cfg.border} ${cfg.cardBg} overflow-hidden`}
                    >
                      {/* Status bar */}
                      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-inherit">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-[var(--color-muted-foreground)] ml-auto">
                          {horario}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="px-4 py-4">
                        <p className="font-bold text-[var(--color-foreground)] text-lg leading-tight mb-0.5">
                          {ag.pet?.nome ?? '—'}
                        </p>
                        <p className="text-sm text-[var(--color-muted-foreground)] mb-3">{servicos}</p>
                        <p className="text-sm font-medium text-[var(--color-foreground)]">{cfg.msg}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
