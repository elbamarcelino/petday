'use client'

import { useEffect, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { criarServico, editarServico } from '@/app/(dashboard)/dashboard/actions'
import type { Servico } from '@/types'

interface Props {
  servico?: Servico
  onClose: () => void
}

const inputCls =
  'w-full px-3 py-2 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white'

export function ServicoModal({ servico, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!servico
  const action = isEdit ? editarServico.bind(null, servico.id) : criarServico
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
              {isEdit ? 'Editar serviço' : 'Novo serviço'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>

          <form action={formAction} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input name="nome" required defaultValue={servico?.nome} placeholder="Ex: Banho Pequeno Porte" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select name="tipo" required defaultValue={servico?.tipo ?? 'banho'} className={inputCls}>
                <option value="banho">Banho</option>
                <option value="tosa">Tosa</option>
                <option value="banho_e_tosa">Banho e Tosa</option>
                <option value="consulta">Consulta</option>
                <option value="vacina">Vacina</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea name="descricao" rows={2} defaultValue={servico?.descricao} placeholder="Descrição do serviço" className={`${inputCls} resize-none`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
                <input name="preco" type="number" step="0.01" min="0" required defaultValue={servico?.preco} placeholder="0,00" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duração (min) *</label>
                <input name="duracao_minutos" type="number" min="1" required defaultValue={servico?.duracao_minutos} placeholder="60" className={inputCls} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="ativo" defaultValue={servico ? (servico.ativo ? 'true' : 'false') : 'true'} className={inputCls}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
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
