import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClienteSession } from '@/lib/cliente-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClienteNav } from '@/components/ClienteNav'

export const dynamic = 'force-dynamic'

const PORTE_LABEL: Record<string, string> = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }
const ESPECIE_EMOJI: Record<string, string> = { cachorro: '🐶', gato: '🐱', outro: '🐾' }

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  pendente:     { label: 'Aguardando', cor: 'bg-yellow-100 text-yellow-800' },
  confirmado:   { label: 'Confirmado', cor: 'bg-blue-100 text-blue-800' },
  em_andamento: { label: 'Em atendimento', cor: 'bg-purple-100 text-purple-800' },
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClienteDashboardPage({ params }: Props) {
  const { slug } = await params
  const session = await getClienteSession(slug)
  if (!session) redirect(`/cliente/${slug}/login`)

  const supabase = createAdminClient()

  const { data: pets } = await supabase
    .from('pets')
    .select('id, nome, especie, porte, raca')
    .eq('cliente_id', session.id)
    .order('nome')

  const petIds = (pets ?? []).map((p) => p.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let proximoAgendamento: any = null

  if (petIds.length > 0) {
    const agora = new Date().toISOString()
    const { data } = await supabase
      .from('agendamentos')
      .select(`id, data_hora, status, pet:pets(nome), agendamento_servicos(servico:servicos(nome))`)
      .in('pet_id', petIds)
      .in('status', ['pendente', 'confirmado', 'em_andamento'])
      .gte('data_hora', agora)
      .order('data_hora', { ascending: true })
      .limit(1)
      .maybeSingle()
    proximoAgendamento = data
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <ClienteNav slug={slug} petshopNome={session.petshopNome} clienteNome={session.nome} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Próximo agendamento */}
        {proximoAgendamento ? (
          <section className="bg-[var(--color-primary)] rounded-2xl p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-2">
              Próximo agendamento
            </p>
            <p className="text-xl font-bold leading-tight mb-0.5">
              {proximoAgendamento.pet?.nome ?? '—'}
            </p>
            <p className="text-sm opacity-90 mb-3">
              {proximoAgendamento.agendamento_servicos
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ?.map((as: any) => as.servico?.nome)
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
            <p className="text-sm font-semibold">
              {new Date(proximoAgendamento.data_hora).toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long',
              })}{' '}
              às{' '}
              {new Date(proximoAgendamento.data_hora).toLocaleTimeString('pt-BR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
            <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full bg-white/20`}>
              {STATUS_LABEL[proximoAgendamento.status]?.label ?? proximoAgendamento.status}
            </span>
          </section>
        ) : (
          <section className="bg-[var(--color-card)] border rounded-2xl p-5 text-center">
            <p className="text-2xl mb-2">📅</p>
            <p className="font-semibold text-[var(--color-foreground)] mb-1">Nenhum agendamento futuro</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Que tal marcar um horário para seu pet?
            </p>
            <Link
              href={`/agendar/${slug}`}
              className="inline-block px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Agendar agora
            </Link>
          </section>
        )}

        {/* Botão agendar quando há próximo */}
        {proximoAgendamento && (
          <Link
            href={`/agendar/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-[var(--color-primary)] text-[var(--color-primary)] font-semibold text-sm hover:bg-purple-50 transition-colors"
          >
            + Novo agendamento
          </Link>
        )}

        {/* Meus pets */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            Meus pets
          </h2>
          {(pets ?? []).length === 0 ? (
            <div className="bg-[var(--color-card)] border rounded-2xl px-6 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Nenhum pet cadastrado ainda.
            </div>
          ) : (
            <div className="grid gap-3">
              {(pets ?? []).map((pet) => (
                <Link
                  key={pet.id}
                  href={`/cliente/${slug}/pets/${pet.id}`}
                  className="flex items-center gap-4 bg-[var(--color-card)] border rounded-2xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-2xl shrink-0">
                    {ESPECIE_EMOJI[pet.especie] ?? '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--color-foreground)] truncate">{pet.nome}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                      {pet.raca || pet.especie} · {PORTE_LABEL[pet.porte] ?? pet.porte}
                    </p>
                  </div>
                  <span className="text-[var(--color-muted-foreground)] shrink-0">›</span>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
