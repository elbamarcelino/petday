import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getClienteSession } from '@/lib/cliente-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClienteNav } from '@/components/ClienteNav'

export const dynamic = 'force-dynamic'

const PORTE_LABEL: Record<string, string> = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }
const ESPECIE_EMOJI: Record<string, string> = { cachorro: '🐶', gato: '🐱', outro: '🐾' }

interface Props {
  params: Promise<{ slug: string; petId: string }>
}

export default async function ClientePetPage({ params }: Props) {
  const { slug, petId } = await params
  const session = await getClienteSession(slug)
  if (!session) redirect(`/cliente/${slug}/login`)

  const supabase = createAdminClient()

  // Verify pet belongs to this client
  const { data: pet } = await supabase
    .from('pets')
    .select('id, nome, especie, porte, raca, nascimento, observacoes')
    .eq('id', petId)
    .eq('cliente_id', session.id)
    .maybeSingle()

  if (!pet) notFound()

  // Agendamentos com foto
  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('id, data_hora, foto_path, agendamento_servicos(servico:servicos(nome))')
    .eq('pet_id', petId)
    .eq('status', 'concluido')
    .not('foto_path', 'is', null)
    .order('data_hora', { ascending: false })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  type AgFoto = {
    id: string
    data_hora: string
    foto_path: string
    agendamento_servicos: { servico: { nome: string } | null }[]
  }

  const fotos = (agendamentos ?? []) as unknown as AgFoto[]

  // Idade do pet
  let idadeLabel = ''
  if (pet.nascimento) {
    const nasc = new Date(pet.nascimento + 'T12:00:00')
    const hoje = new Date()
    const anos = hoje.getFullYear() - nasc.getFullYear()
    const meses =
      hoje.getMonth() - nasc.getMonth() + (hoje.getDate() < nasc.getDate() ? -1 : 0)
    const mesesTotal = anos * 12 + meses
    if (mesesTotal < 12) {
      idadeLabel = `${mesesTotal} ${mesesTotal === 1 ? 'mês' : 'meses'}`
    } else {
      idadeLabel = `${anos} ${anos === 1 ? 'ano' : 'anos'}`
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <ClienteNav slug={slug} petshopNome={session.petshopNome} clienteNome={session.nome} />

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Back */}
        <Link
          href={`/cliente/${slug}/dashboard`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          ← Voltar
        </Link>

        {/* Perfil do pet */}
        <div className="bg-[var(--color-card)] border rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-4xl shrink-0">
              {ESPECIE_EMOJI[pet.especie] ?? '🐾'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{pet.nome}</h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {pet.raca || pet.especie} · {PORTE_LABEL[pet.porte] ?? pet.porte}
                {idadeLabel && ` · ${idadeLabel}`}
              </p>
            </div>
          </div>

          {pet.observacoes && (
            <div className="bg-[var(--color-muted)]/50 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-1">
                Observações
              </p>
              <p className="text-sm text-[var(--color-foreground)]">{pet.observacoes}</p>
            </div>
          )}
        </div>

        {/* Galeria de fotos */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            Galeria de atendimentos
          </h2>

          {fotos.length === 0 ? (
            <div className="bg-[var(--color-card)] border rounded-2xl px-6 py-10 text-center">
              <p className="text-3xl mb-2">📸</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhuma foto registrada ainda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((ag) => {
                const fotoUrl = `${supabaseUrl}/storage/v1/object/public/fotos-pets/${ag.foto_path}`
                const servicos = ag.agendamento_servicos
                  .map((as) => as.servico?.nome)
                  .filter(Boolean)
                  .join(', ')
                const data = new Date(ag.data_hora).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                })

                return (
                  <div key={ag.id} className="rounded-2xl overflow-hidden border bg-[var(--color-card)]">
                    <div className="aspect-square relative bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fotoUrl}
                        alt={`Foto de ${pet.nome}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
                        {servicos || '—'}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{data}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
