import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CaixaClient } from '@/components/CaixaClient'
import type { CaixaMovimento } from '@/types'

export default async function CaixaPage() {
  const supabase = await createClient()

  const now = new Date()
  const dataAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: movimentos } = await supabase
    .from('caixa_movimentos')
    .select('*')
    .eq('data', dataAtual)
    .order('created_at', { ascending: false })

  const lista = (movimentos ?? []) as CaixaMovimento[]

  const totalEntradas = lista
    .filter((m) => m.tipo === 'entrada')
    .reduce((s, m) => s + m.valor, 0)

  const totalSaidas = lista
    .filter((m) => m.tipo === 'saida')
    .reduce((s, m) => s + m.valor, 0)

  const saldo = totalEntradas - totalSaidas

  const dataFormatada = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <div>
        <Link
          href="/dashboard/financeiro"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Financeiro
        </Link>

        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Caixa do dia</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 capitalize">{dataFormatada}</p>
      </div>

      <CaixaClient
        movimentos={lista}
        dataAtual={dataAtual}
        totalEntradas={totalEntradas}
        totalSaidas={totalSaidas}
        saldo={saldo}
      />

    </div>
  )
}
