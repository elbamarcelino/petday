'use client'

import { useState, useEffect, useRef, useActionState } from 'react'
import { criarPet } from '@/app/(dashboard)/dashboard/actions'
import type { Cliente } from '@/types'

interface Props {
  clientes: Cliente[]
}

export function NovoPetModal({ clientes }: Props) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(criarPet, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        + Novo pet
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
                  Novo pet
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
                    Tutor *
                  </label>
                  <select
                    name="cliente_id"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  >
                    <option value="">Selecione o tutor</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Nome do pet *
                  </label>
                  <input
                    name="nome"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Nome do animal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Espécie *
                  </label>
                  <input
                    name="especie"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Ex: cachorro, gato, ave"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Raça
                  </label>
                  <input
                    name="raca"
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Ex: Golden Retriever"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Porte *
                  </label>
                  <select
                    name="porte"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                  >
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Data de nascimento
                  </label>
                  <input
                    name="nascimento"
                    type="date"
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Observações
                  </label>
                  <textarea
                    name="observacoes"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    placeholder="Alergias, comportamento, etc."
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
