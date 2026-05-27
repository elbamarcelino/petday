import { redirect } from 'next/navigation'
import { getClienteSession } from '@/lib/cliente-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClienteNav } from '@/components/ClienteNav'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  pendente:     { label: 'Aguardando',    badge: 'bg-yellow-100 text-yellow-800' },
  confirmado:   { label: 'Confirmado',    badge: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em atendimento', badge: 'bg-purple-100 text-purple-800' },
  concluido:    { label: 'Concluído',     badge: 'bg-green-100 text-green-800' },
  cancelado:    { label: 'Cancelado',     badge: 'bg-red-100 text-red-800' },
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClienteHistoricoPage({ params }: Props) {
  const { slug } = await params
  const session = await getClienteSession(slug)
  if (!session) redirect(`/cliente/${slug}/login`)

  const supabase = createAdminClient()

  const { data: pets } = await supabase
    .from('pets')
    .select('id')
    .eq('cliente_id', session.id)

  const petIds = (pets ?? []).map((p) => p.id)

  const agendamentos =
    petIds.length === 0
      ? []
      : (
          await supabase
            .from('agendamentos')
            .select(
              `id, data_hora, status, preco_cobrado,
               pet:pets(id, nome),
               agendamento_servicos(servico:servicos(nome))`,
            )
            .in('pet_id', petIds)
            .order('data_hora', { ascending: false })
        ).data ?? []

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <ClienteNav slug={slug} petshopNome={session.petshopNome} clienteNome={session.nome} />

      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">Histórico</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Todos os agendamentos dos seus pets.
        </p>

        {agendamentos.length === 0 ? (
          <div className="bg-[var(--color-card)] border rounded-2xl px-6 py-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="font-semibold text-[var(--color-foreground)] mb-1">Sem histórico ainda</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Seus agendamentos aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map((ag) => {
              type AgType = {
                id: string
                data_hora: string
                status: string
                preco_cobrado: number
                pet: { id: string; nome: string } | null
                agendamento_servicos: { servico: { nome: string } | null }[]
              }
              const a = ag as unknown as AgType
              const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pendente
              const servicos =
                a.agendamento_servicos
                  .map((as) => as.servico?.nome)
                  .filter(Boolean)
                  .join(', ') || '—'

              return (
                <div key={a.id} className="bg-[var(--color-card)] border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--color-foreground)] truncate">
                        {a.pet?.nome ?? '—'}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {new Date(a.data_hora).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                        })}{' '}
                        às{' '}
                        {new Date(a.data_hora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)] truncate mb-2">{servicos}</p>
                  <p className="text-sm font-bold text-[var(--color-primary)]">{fmt(a.preco_cobrado)}</p>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
