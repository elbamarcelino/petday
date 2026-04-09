'use client'

import { useState, useEffect, useRef, useActionState } from 'react'
import { criarAgendamento } from '@/app/(dashboard)/dashboard/actions'
import type { Pet, Servico } from '@/types'

interface Props {
  pets: Pet[]
  servicos: Servico[]
}

export function NovoAgendamentoModal({ pets, servicos }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(criarAgendamento, null)
  const [preco, setPreco] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      setPreco('')
      formRef.current?.reset()
    }
  }, [state])

  function handleServicoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const servico = servicos.find((s) => s.id === e.target.value)
    setPreco(servico ? String(servico.preco) : '')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        + Novo agendamento
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                  Novo agendamento
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              <form ref={formRef} action={formAction} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Pet *
                  </label>
                  <select
                    name="pet_id"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  >
                    <option value="">Selecione o pet</option>
                    {pets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} {p.cliente ? `— ${p.cliente.nome}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Serviço *
                  </label>
                  <select
                    name="servico_id"
                    required
                    onChange={handleServicoChange}
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  >
                    <option value="">Selecione o serviço</option>
                    {servicos
                      .filter((s) => s.ativo)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nome} — R$ {s.preco.toFixed(2)}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Data e hora *
                  </label>
                  <input
                    name="data_hora"
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Valor cobrado (R$) *
                  </label>
                  <input
                    name="preco_cobrado"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue="pendente"
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    placeholder="Instruções especiais, etc."
                  />
                </div>

                {state?.error && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)]">
                    {state.error}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2 border rounded-[var(--radius)] text-sm font-medium hover:bg-[var(--color-muted)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {pending ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
