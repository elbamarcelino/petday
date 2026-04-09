'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PetModal } from './PetModal'
import { excluirPet } from '@/app/(dashboard)/dashboard/actions'
import type { Pet, Porte, Cliente } from '@/types'

const porteLabel: Record<Porte, string> = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }
const porteBadge: Record<Porte, string> = {
  pequeno: 'bg-green-100 text-green-700',
  medio: 'bg-blue-100 text-blue-700',
  grande: 'bg-orange-100 text-orange-700',
}
function petEmoji(especie: string) {
  const map: Record<string, string> = { cachorro: '🐶', gato: '🐱', ave: '🐦', coelho: '🐰' }
  return map[especie.toLowerCase()] ?? '🐾'
}

interface Props {
  pets: Pet[]
  clientes: Pick<Cliente, 'id' | 'nome'>[]
}

export function PetsClient({ pets, clientes }: Props) {
  const [editing, setEditing] = useState<Pet | null>(null)
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
      const result = await excluirPet(id)
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
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Pets</h1>
            <p className="text-gray-500 text-sm mt-1">Animais cadastrados no sistema</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Novo pet
          </button>
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)] border border-red-200">
            Erro ao excluir: {deleteError}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pets.length > 0 ? (
            pets.map((p) => (
              <div key={p.id} className="bg-[var(--color-card)] rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{petEmoji(p.especie)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.nome}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${porteBadge[p.porte]}`}>
                        {porteLabel[p.porte]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{p.especie}{p.raca ? ` • ${p.raca}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-1">Tutor: {p.cliente?.nome}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => { setDeleteError(null); setEditing(p) }}
                    className="flex-1 py-1.5 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
                  >
                    Editar
                  </button>
                  {deletingId === p.id ? (
                    <div className="flex-1 flex items-center gap-1">
                      <span className="text-xs text-gray-500">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(p.id)}
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
                      onClick={() => { setDeleteError(null); setDeletingId(p.id) }}
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
              Nenhum pet cadastrado ainda.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <PetModal
          key={editing?.id ?? 'new'}
          pet={editing ?? undefined}
          clientes={clientes}
          onClose={closeModal}
        />
      )}
    </>
  )
}
