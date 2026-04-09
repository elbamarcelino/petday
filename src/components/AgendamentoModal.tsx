'use client'

import { useEffect, useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { criarAgendamento, editarAgendamento } from '@/app/(dashboard)/dashboard/actions'
import type { Agendamento, Pet, Servico } from '@/types'

interface Props {
  agendamento?: Agendamento
  pets: (Pet & { cliente?: { nome: string } })[]
  servicos: Servico[]
  onClose: () => void
}

const inputCls =
  'w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white'

export function AgendamentoModal({ agendamento, pets, servicos, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!agendamento
  const action = isEdit ? editarAgendamento.bind(null, agendamento.id) : criarAgendamento
  const [state, formAction, pending] = useActionState(action, null)

  const initialIds = new Set(
    agendamento?.agendamento_servicos?.map((as) => as.servico_id) ?? []
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialIds)

  const totalAuto = servicos
    .filter((s) => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.preco, 0)

  const [preco, setPreco] = useState(
    isEdit ? String(agendamento.preco_cobrado) : ''
  )

  function toggleServico(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const total = servicos.filter((s) => next.has(s.id)).reduce((sum, s) => sum + s.preco, 0)
      setPreco(total.toFixed(2))
      return next
    })
  }

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state, onClose, router])

  const dataHoraDefault = agendamento
    ? new Date(agendamento.data_hora).toISOString().slice(0, 16)
    : undefined

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">
              {isEdit ? 'Editar agendamento' : 'Novo agendamento'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form action={formAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pet *</label>
              <select name="pet_id" required defaultValue={agendamento?.pet_id ?? ''} className={inputCls}>
                <option value="">Selecione o pet</option>
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.cliente ? ` — ${p.cliente.nome}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Serviços * (selecione um ou mais)</label>
              <div className="space-y-2 border rounded-[var(--radius)] p-3 max-h-48 overflow-y-auto">
                {servicos.filter((s) => s.ativo).map((s) => (
                  <label key={s.id} className="flex items-center gap-3 cursor-pointer hover:bg-[var(--color-muted)] px-2 py-1.5 rounded-[var(--radius)]">
                    <input
                      type="checkbox"
                      name="servico_ids"
                      value={s.id}
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleServico(s.id)}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                    <span className="flex-1 text-sm">{s.nome}</span>
                    <span className="text-sm text-gray-500 font-medium">
                      {s.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </label>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedIds.size} serviço(s) — total automático:{' '}
                  <strong>{totalAuto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Data e hora *</label>
                <input name="data_hora" type="datetime-local" required defaultValue={dataHoraDefault} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valor cobrado (R$) *</label>
                <input
                  name="preco_cobrado"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" defaultValue={agendamento?.status ?? 'pendente'} className={inputCls}>
                <option value="pendente">Pendente</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea name="observacoes" rows={2} defaultValue={agendamento?.observacoes} placeholder="Instruções especiais, etc." className={`${inputCls} resize-none`} />
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)]">{state.error}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-[var(--radius)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={pending} className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {pending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
