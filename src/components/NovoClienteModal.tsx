'use client'

import { useState, useEffect, useRef, useActionState } from 'react'
import { criarCliente } from '@/app/(dashboard)/dashboard/actions'

export function NovoClienteModal() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(criarCliente, null)
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
        + Novo cliente
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                  Novo cliente
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
                    Nome *
                  </label>
                  <input
                    name="nome"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    E-mail *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Telefone *
                  </label>
                  <input
                    name="telefone"
                    required
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    Endereço
                  </label>
                  <input
                    name="endereco"
                    className="w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    placeholder="Rua, número, bairro"
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
