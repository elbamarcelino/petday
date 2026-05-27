'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { criarMovimento, excluirMovimento } from '@/app/(dashboard)/dashboard/financeiro/actions'
import type { CaixaMovimento } from '@/types'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  movimentos: CaixaMovimento[]
  dataAtual: string
  totalEntradas: number
  totalSaidas: number
  saldo: number
}

export function CaixaClient({ movimentos, dataAtual, totalEntradas, totalSaidas, saldo }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPendingDelete, startDelete] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await criarMovimento(null, formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        setFormError(null)
        form.reset()
        setTipo('entrada')
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      await excluirMovimento(id)
      setDeletingId(null)
      router.refresh()
    })
  }

  const inputCls = 'w-full text-sm border rounded-[var(--radius)] px-3 py-2 bg-[var(--color-background)]'

  return (
    <div className="space-y-6">

      {/* ── Cards de saldo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-card)] rounded-2xl border p-5 shadow-sm">
          <p className="text-xs text-[var(--color-muted-foreground)] font-medium">Entradas</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalEntradas)}</p>
        </div>
        <div className="bg-[var(--color-card)] rounded-2xl border p-5 shadow-sm">
          <p className="text-xs text-[var(--color-muted-foreground)] font-medium">Saídas</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalSaidas)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-[var(--color-muted-foreground)] font-medium">Saldo do dia</p>
          <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {fmt(saldo)}
          </p>
        </div>
      </div>

      {/* ── Formulário de lançamento ── */}
      <div className="bg-[var(--color-card)] rounded-2xl border p-6">
        <h2 className="text-base font-bold text-[var(--color-foreground)] mb-4">Novo lançamento</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`flex-1 py-2 text-sm font-semibold rounded-[var(--radius)] border transition-colors ${
                tipo === 'entrada'
                  ? 'bg-green-500 text-white border-green-500'
                  : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              ↑ Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo('saida')}
              className={`flex-1 py-2 text-sm font-semibold rounded-[var(--radius)] border transition-colors ${
                tipo === 'saida'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              ↓ Saída
            </button>
          </div>

          {/* Hidden tipo */}
          <input type="hidden" name="tipo" value={tipo} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Descrição *</label>
              <input
                type="text"
                name="descricao"
                required
                placeholder={tipo === 'entrada' ? 'ex: Venda de shampoo, gorjeta...' : 'ex: Compra de shampoo, conta de luz...'}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Valor (R$) *</label>
              <input
                type="number"
                name="valor"
                required
                min="0.01"
                step="0.01"
                placeholder="0,00"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Data *</label>
              <input
                type="date"
                name="data"
                required
                defaultValue={dataAtual}
                className={inputCls}
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[var(--radius)]">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className={`px-5 py-2 text-sm font-semibold text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition-opacity ${
                tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {isPending ? 'Salvando...' : `Registrar ${tipo === 'entrada' ? 'entrada' : 'saída'}`}
            </button>
          </div>
        </form>
      </div>

      {/* ── Lista de movimentos ── */}
      <div className="bg-[var(--color-card)] rounded-2xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-bold text-[var(--color-foreground)]">
            Movimentos do dia
            {movimentos.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                {movimentos.length}
              </span>
            )}
          </h2>
        </div>

        {movimentos.length === 0 ? (
          <p className="px-6 py-10 text-sm text-[var(--color-muted-foreground)] text-center">
            Nenhum movimento registrado hoje.
          </p>
        ) : (
          <div className="divide-y divide-[var(--color-muted)]/60">
            {movimentos.map((mv) => (
              <div key={mv.id} className="flex items-center gap-3 px-5 py-3">
                {/* Tipo badge */}
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    mv.tipo === 'entrada'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {mv.tipo === 'entrada' ? '↑' : '↓'}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {mv.descricao}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {fmtHora(mv.created_at)}
                  </p>
                </div>

                {/* Valor */}
                <p className={`shrink-0 text-sm font-semibold ${mv.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                  {mv.tipo === 'entrada' ? '+' : '-'}{fmt(mv.valor)}
                </p>

                {/* Delete */}
                {deletingId === mv.id ? (
                  <div className="shrink-0 flex items-center gap-1">
                    <span className="text-xs text-[var(--color-muted-foreground)]">Confirmar?</span>
                    <button
                      onClick={() => handleDelete(mv.id)}
                      disabled={isPendingDelete}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-[var(--radius)] hover:bg-red-600 disabled:opacity-50"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="px-2 py-1 text-xs border rounded-[var(--radius)] hover:bg-[var(--color-muted)]"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(mv.id)}
                    className="shrink-0 text-xs text-red-400 hover:text-red-600 hover:underline"
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
