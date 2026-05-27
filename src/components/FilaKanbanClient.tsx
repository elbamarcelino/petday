'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Agendamento, StatusAgendamento } from '@/types'
import { atualizarStatusAgendamento } from '@/app/(dashboard)/dashboard/actions'

const COLUNAS: {
  status: StatusAgendamento
  label: string
  headerCor: string
  borderCor: string
  badgeCor: string
}[] = [
  {
    status: 'pendente',
    label: 'Pendente',
    headerCor: 'bg-yellow-50 border-yellow-200',
    borderCor: 'border-l-yellow-400',
    badgeCor: 'bg-yellow-100 text-yellow-800',
  },
  {
    status: 'confirmado',
    label: 'Confirmado',
    headerCor: 'bg-blue-50 border-blue-200',
    borderCor: 'border-l-blue-400',
    badgeCor: 'bg-blue-100 text-blue-800',
  },
  {
    status: 'em_andamento',
    label: 'Em andamento',
    headerCor: 'bg-purple-50 border-purple-200',
    borderCor: 'border-l-purple-400',
    badgeCor: 'bg-purple-100 text-purple-800',
  },
  {
    status: 'concluido',
    label: 'Concluído',
    headerCor: 'bg-green-50 border-green-200',
    borderCor: 'border-l-green-400',
    badgeCor: 'bg-green-100 text-green-800',
  },
  {
    status: 'cancelado',
    label: 'Cancelado',
    headerCor: 'bg-red-50 border-red-200',
    borderCor: 'border-l-red-400',
    badgeCor: 'bg-red-100 text-red-800',
  },
]

function addDias(dateStr: string, dias: number): string {
  const date = new Date(dateStr + 'T12:00:00')
  date.setDate(date.getDate() + dias)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dataHoje(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface FilaKanbanClientProps {
  agendamentos: Agendamento[]
  dataAtual: string
}

export function FilaKanbanClient({ agendamentos: agendamentosIniciais, dataAtual }: FilaKanbanClientProps) {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState(agendamentosIniciais)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<StatusAgendamento | null>(null)
  const [, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const hoje = dataHoje()
  const isHoje = dataAtual === hoje

  // Sincroniza estado local quando o servidor traz dados novos (via router.refresh)
  useEffect(() => {
    if (!draggingId) setAgendamentos(agendamentosIniciais)
  }, [agendamentosIniciais]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling a cada 30s para manter o kanban atualizado sem recarregar a página
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  const dataLabel = new Date(dataAtual + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  function navegarDia(delta: number) {
    const novaData = addDias(dataAtual, delta)
    router.push(`/dashboard/fila?data=${novaData}`)
  }

  function irParaHoje() {
    router.push(`/dashboard/fila?data=${hoje}`)
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverStatus(null)
  }

  function handleDragOver(e: React.DragEvent, status: StatusAgendamento) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  function handleDragLeave(e: React.DragEvent) {
    const relatedTarget = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverStatus(null)
    }
  }

  function handleDrop(e: React.DragEvent, novoStatus: StatusAgendamento) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    const agendamento = agendamentos.find((a) => a.id === id)

    setDraggingId(null)
    setDragOverStatus(null)

    if (!agendamento || agendamento.status === novoStatus) return

    const statusAnterior = agendamento.status

    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)))
    setErro(null)

    startTransition(async () => {
      const result = await atualizarStatusAgendamento(id, novoStatus)
      if (result?.error) {
        setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status: statusAnterior } : a)))
        setErro(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const totalAgendamentos = agendamentos.length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Fila do dia</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{dataLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isHoje && (
            <button
              onClick={irParaHoje}
              className="px-3 py-1.5 text-xs rounded-[var(--radius)] bg-[var(--color-primary)] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Hoje
            </button>
          )}
          <div className="flex items-center rounded-[var(--radius)] border overflow-hidden">
            <button
              onClick={() => navegarDia(-1)}
              className="px-3 py-2 hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)] text-sm"
              aria-label="Dia anterior"
            >
              ←
            </button>
            <span
              className={`px-4 py-2 text-sm font-medium border-x ${
                isHoje
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-card)] text-[var(--color-foreground)]'
              }`}
            >
              {isHoje ? 'Hoje · ' : ''}
              {new Date(dataAtual + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={() => navegarDia(1)}
              className="px-3 py-2 hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)] text-sm"
              aria-label="Próximo dia"
            >
              →
            </button>
          </div>
          <span className="text-xs text-gray-400 ml-1">
            {totalAgendamentos} agendamento{totalAgendamentos !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {erro && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius)] text-sm text-red-700">
          Erro ao atualizar status: {erro}
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden pb-3 flex-1 min-h-0">
        {COLUNAS.map(({ status, label, headerCor, borderCor, badgeCor }) => {
          const cards = agendamentos.filter((a) => a.status === status)
          const isDragOver = dragOverStatus === status

          return (
            <div
              key={status}
              className="flex flex-col w-60 flex-shrink-0 min-h-0"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column header */}
              <div
                className={`rounded-t-[var(--radius)] border px-3 py-2.5 ${headerCor} flex items-center justify-between`}
              >
                <span className="text-sm font-semibold text-[var(--color-foreground)]">{label}</span>
                <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${badgeCor}`}>{cards.length}</span>
              </div>

              {/* Drop area */}
              <div
                className={`flex-1 min-h-0 overflow-y-auto rounded-b-[var(--radius)] border-x border-b p-2 space-y-2 transition-all ${
                  isDragOver
                    ? 'bg-[var(--color-primary)]/5 border-[var(--color-primary)] border-dashed'
                    : 'border-gray-200 bg-gray-50/30'
                }`}
              >
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                    {isDragOver ? '↓ Solte aqui' : 'Sem agendamentos'}
                  </div>
                )}
                {cards.map((ag) => (
                  <KanbanCard
                    key={ag.id}
                    agendamento={ag}
                    borderCor={borderCor}
                    isDragging={draggingId === ag.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({
  agendamento,
  borderCor,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  agendamento: Agendamento
  borderCor: string
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragEnd: () => void
}) {
  const horario = new Date(agendamento.data_hora).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const servicos =
    agendamento.agendamento_servicos
      ?.map((as) => as.servico?.nome)
      .filter(Boolean)
      .join(', ') || '—'

  const nomePet = agendamento.pet?.nome || '—'
  const nomeCliente = agendamento.pet?.cliente?.nome || '—'
  const preco = agendamento.preco_cobrado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, agendamento.id)}
      onDragEnd={onDragEnd}
      className={`bg-[var(--color-card)] rounded-[var(--radius)] border border-l-4 ${borderCor} p-3 shadow-sm cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-semibold text-sm text-[var(--color-foreground)] leading-tight">{nomePet}</span>
        <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{horario}</span>
      </div>
      <p className="text-xs text-gray-500 mb-1.5 truncate">{nomeCliente}</p>
      <p className="text-xs text-[var(--color-foreground)]/60 line-clamp-2 leading-tight">{servicos}</p>
      <div className="mt-2 pt-2 border-t border-gray-100 text-right">
        <span className="text-sm font-bold text-[var(--color-primary)]">{preco}</span>
      </div>
    </div>
  )
}
