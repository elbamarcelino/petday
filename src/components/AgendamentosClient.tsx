'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AgendamentoModal } from './AgendamentoModal'
import { FotoWhatsAppModal } from './FotoWhatsAppModal'
import { excluirAgendamento, atualizarStatusAgendamento } from '@/app/(dashboard)/dashboard/actions'
import type { Agendamento, StatusAgendamento, Pet, Servico, Cliente } from '@/types'

const statusLabel: Record<StatusAgendamento, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}
const statusColor: Record<StatusAgendamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  confirmado: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-purple-100 text-purple-800',
  concluido: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
}
const statusDescricao: Record<StatusAgendamento, string> = {
  pendente: 'Agendado — pet ainda não chegou',
  confirmado: 'Confirmado com o tutor',
  em_andamento: 'Pet está sendo atendido',
  concluido: 'Serviço finalizado — pronto para buscar',
  cancelado: 'Não vai acontecer',
}

interface Props {
  agendamentos: Agendamento[]
  pets: (Pet & { cliente?: Pick<Cliente, 'nome' | 'telefone'> })[]
  servicos: Servico[]
}

export function AgendamentosClient({ agendamentos, pets, servicos }: Props) {
  const [editing, setEditing] = useState<Agendamento | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [fotoAgendamento, setFotoAgendamento] = useState<Agendamento | null>(null)
  const [statusSaving, setStatusSaving] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const modalOpen = creating || !!editing

  function closeModal() {
    setCreating(false)
    setEditing(null)
  }

  async function handleStatusChange(id: string, newStatus: StatusAgendamento) {
    setStatusSaving(prev => new Set([...prev, id]))
    const result = await atualizarStatusAgendamento(id, newStatus)
    if (result?.error) {
      setDeleteError(result.error)
    } else {
      router.refresh()
    }
    setStatusSaving(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleDelete(id: string) {
    setDeleteError(null)
    startTransition(async () => {
      const result = await excluirAgendamento(id)
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
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Agendamentos</h1>
            <p className="text-gray-500 text-sm mt-1">Gerencie os agendamentos do petshop</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Novo agendamento
          </button>
        </div>

        {deleteError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-[var(--radius)] border border-red-200">
            Erro ao excluir: {deleteError}
          </p>
        )}

        {/* Legenda de status */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs bg-[var(--color-card)] border rounded-[var(--radius)] px-4 py-3">
          <span className="font-semibold text-[var(--color-foreground)] shrink-0">Significado dos status:</span>
          {(Object.keys(statusLabel) as StatusAgendamento[]).map(s => (
            <span key={s} className="flex items-center gap-1.5 text-gray-600">
              <span className={`px-1.5 py-0.5 rounded-full font-medium ${statusColor[s]}`}>{statusLabel[s]}</span>
              <span>— {statusDescricao[s]}</span>
            </span>
          ))}
        </div>

        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              <tr>
                <th className="text-left px-6 py-3 font-semibold">Pet / Cliente</th>
                <th className="text-left px-6 py-3 font-semibold">Serviços</th>
                <th className="text-left px-6 py-3 font-semibold">Data e hora</th>
                <th className="text-left px-6 py-3 font-semibold">Status</th>
                <th className="text-left px-6 py-3 font-semibold">Valor</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {agendamentos.length > 0 ? (
                agendamentos.map((a) => {
                  const nomeServicos = a.agendamento_servicos
                    ?.map((as) => as.servico?.nome)
                    .filter(Boolean)
                    .join(', ') ?? '—'

                  return (
                    <tr key={a.id} className="hover:bg-[var(--color-background)] transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium">{a.pet?.nome}</p>
                        <p className="text-gray-400 text-xs">{a.pet?.cliente?.nome}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                        <p className="truncate" title={nomeServicos}>{nomeServicos}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(a.data_hora).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={a.status}
                          onChange={(e) => handleStatusChange(a.id, e.target.value as StatusAgendamento)}
                          disabled={statusSaving.has(a.id)}
                          title={statusDescricao[a.status]}
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColor[a.status]} ${statusSaving.has(a.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {(Object.keys(statusLabel) as StatusAgendamento[]).map(s => (
                            <option key={s} value={s}>{statusLabel[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {a.preco_cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {(a.status === 'em_andamento' || a.status === 'concluido') && (
                            <button
                              onClick={() => setFotoAgendamento(a)}
                              title="Salvar foto e concluir agendamento"
                              className="px-3 py-1.5 text-xs font-medium text-[#25d366] border border-[#25d366]/40 rounded-[var(--radius)] hover:bg-[#25d366]/10 transition-colors"
                            >
                              📷 Foto
                            </button>
                          )}
                          <button
                            onClick={() => { setDeleteError(null); setEditing(a) }}
                            className="px-3 py-1.5 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
                          >
                            Editar
                          </button>
                          {deletingId === a.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">Confirmar?</span>
                              <button
                                onClick={() => handleDelete(a.id)}
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
                              onClick={() => { setDeleteError(null); setDeletingId(a.id) }}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-[var(--radius)] hover:bg-red-50 transition-colors"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Nenhum agendamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <AgendamentoModal
          key={editing?.id ?? 'new'}
          agendamento={editing ?? undefined}
          pets={pets}
          servicos={servicos}
          onClose={closeModal}
        />
      )}

      {fotoAgendamento && (
        <FotoWhatsAppModal
          key={fotoAgendamento.id}
          agendamento={fotoAgendamento}
          onClose={() => setFotoAgendamento(null)}
          onSuccess={() => {
            setFotoAgendamento(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
