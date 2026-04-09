'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ClienteModal } from './ClienteModal'
import { excluirCliente } from '@/app/(dashboard)/dashboard/actions'
import type { Cliente } from '@/types'

export function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const modalOpen = creating || !!editing

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await excluirCliente(id)
      if (result?.error) {
        setDeleteError(result.error)
      } else {
        setDeletingId(null)
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Clientes</h1>
            <p className="text-gray-500 text-sm mt-1">Gerenciar clientes cadastrados</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Novo cliente
          </button>
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)] border border-red-200">
            Erro ao excluir: {deleteError}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.length > 0 ? (
            clientes.map((c) => (
              <div key={c.id} className="bg-[var(--color-card)] rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-primary)] font-bold text-lg flex-shrink-0">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{c.nome}</p>
                    <p className="text-xs text-gray-500 truncate">{c.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.telefone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => { setDeleteError(null); setEditing(c) }}
                    className="flex-1 py-1.5 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
                  >
                    Editar
                  </button>
                  {deletingId === c.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-xs text-gray-500">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="px-2 py-1.5 text-xs font-medium text-white bg-red-500 rounded-[var(--radius)] hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1.5 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setDeleteError(null); setDeletingId(c.id) }}
                      className="flex-1 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-[var(--radius)] hover:bg-red-50 transition-colors"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-gray-400">
              Nenhum cliente cadastrado ainda.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ClienteModal
          key={editing?.id ?? 'new'}
          cliente={editing ?? undefined}
          onClose={closeModal}
        />
      )}
    </>
  )
}
