'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type Periodo = 'hoje' | 'semana' | 'mes' | 'mes_anterior' | 'custom'

const LABELS: Record<Periodo, string> = {
  hoje: 'Hoje',
  semana: 'Esta semana',
  mes: 'Este mês',
  mes_anterior: 'Mês anterior',
  custom: 'Personalizado',
}

interface Props {
  periodoAtivo: Periodo
  inicio?: string
  fim?: string
}

export function FinanceiroPeriodoFiltro({ periodoAtivo, inicio, fim }: Props) {
  const router = useRouter()
  const [showCustom, setShowCustom] = useState(periodoAtivo === 'custom')
  const [customInicio, setCustomInicio] = useState(inicio ?? '')
  const [customFim, setCustomFim] = useState(fim ?? '')

  function navegar(p: Periodo) {
    if (p === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    router.push(`/dashboard/financeiro?periodo=${p}`)
  }

  function aplicarCustom() {
    if (!customInicio || !customFim) return
    router.push(`/dashboard/financeiro?periodo=custom&inicio=${customInicio}&fim=${customFim}`)
  }

  const btnCls = (p: Periodo) =>
    `px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
      periodoAtivo === p || (p === 'custom' && showCustom)
        ? 'bg-[var(--color-primary)] text-white'
        : 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:opacity-80'
    }`

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(['hoje', 'semana', 'mes', 'mes_anterior', 'custom'] as Periodo[]).map((p) => (
          <button key={p} onClick={() => navegar(p)} className={btnCls(p)}>
            {LABELS[p]}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <input
            type="date"
            value={customInicio}
            onChange={(e) => setCustomInicio(e.target.value)}
            className="text-sm border rounded-[var(--radius)] px-3 py-1.5 bg-[var(--color-background)]"
          />
          <span className="text-sm text-[var(--color-muted-foreground)]">até</span>
          <input
            type="date"
            value={customFim}
            onChange={(e) => setCustomFim(e.target.value)}
            className="text-sm border rounded-[var(--radius)] px-3 py-1.5 bg-[var(--color-background)]"
          />
          <button
            onClick={aplicarCustom}
            disabled={!customInicio || !customFim}
            className="px-4 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}
