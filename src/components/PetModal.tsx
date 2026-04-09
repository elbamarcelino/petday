'use client'

import { useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { criarPet, editarPet } from '@/app/(dashboard)/dashboard/actions'
import type { Pet, Cliente } from '@/types'

interface Props {
  pet?: Pet
  clientes: Pick<Cliente, 'id' | 'nome'>[]
  onClose: () => void
}

const inputCls =
  'w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white'

export function PetModal({ pet, clientes, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!pet
  const action = isEdit ? editarPet.bind(null, pet.id) : criarPet
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) {
      router.refresh()
      onClose()
    }
  }, [state, onClose, router])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">
              {isEdit ? 'Editar pet' : 'Novo pet'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tutor *</label>
              <select name="cliente_id" required defaultValue={pet?.cliente_id ?? ''} className={inputCls}>
                <option value="">Selecione o tutor</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome do pet *</label>
              <input name="nome" required defaultValue={pet?.nome} placeholder="Nome do animal" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Espécie *</label>
              <input name="especie" required defaultValue={pet?.especie} placeholder="Ex: cachorro, gato, ave" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Raça</label>
              <input name="raca" defaultValue={pet?.raca} placeholder="Ex: Golden Retriever" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Porte *</label>
              <select name="porte" required defaultValue={pet?.porte ?? 'medio'} className={inputCls}>
                <option value="pequeno">Pequeno</option>
                <option value="medio">Médio</option>
                <option value="grande">Grande</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de nascimento</label>
              <input name="nascimento" type="date" defaultValue={pet?.nascimento} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea name="observacoes" rows={2} defaultValue={pet?.observacoes} placeholder="Alergias, comportamento, etc." className={`${inputCls} resize-none`} />
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
