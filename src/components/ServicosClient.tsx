'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ServicoModal } from './ServicoModal'
import { excluirServico } from '@/app/(dashboard)/dashboard/actions'
import type { Servico } from '@/types'

export function ServicosClient({ servicos }: { servicos: Servico[] }) {
  const [editing, setEditing] = useState<Servico | null>(null)
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
      const result = await excluirServico(id)
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
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Serviços</h1>
            <p className="text-gray-500 text-sm mt-1">Serviços oferecidos pelo petshop</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Novo serviço
          </button>
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)] border border-red-200">
            Erro ao excluir: {deleteError}
          </p>
        )}

        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Nome</th>
                <th className="text-left px-6 py-3 font-semibold">Tipo</th>
                <th className="text-left px-6 py-3 font-semibold">Duração</th>
                <th className="text-left px-6 py-3 font-semibold">Preço</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {servicos.length > 0 ? (
                servicos.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--color-background)] transition-colors">
                    <td className="px-6 py-4 font-medium">{s.nome}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{s.tipo.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-gray-600">{s.duracao_minutos} min</td>
                    <td className="px-6 py-4 font-medium">
                      {s.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setDeleteError(null); setEditing(s) }}
                          className="px-3 py-1.5 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
                        >
                          Editar
                        </button>
                        {deletingId === s.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Confirmar?</span>
                            <button
                              onClick={() => handleDelete(s.id)}
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
                            onClick={() => { setDeleteError(null); setDeletingId(s.id) }}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-[var(--radius)] hover:bg-red-50 transition-colors"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum serviço cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <ServicoModal
          key={editing?.id ?? 'new'}
          servico={editing ?? undefined}
          onClose={closeModal}
        />
      )}
    </>
  )
}
