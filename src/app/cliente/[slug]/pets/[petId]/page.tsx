import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getClienteSession } from '@/lib/cliente-session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ClienteNav } from '@/components/ClienteNav'

export const dynamic = 'force-dynamic'

const PORTE_LABEL: Record<string, string> = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }
const ESPECIE_EMOJI: Record<string, string> = { cachorro: '🐶', gato: '🐱', outro: '🐾' }

const AGITACAO_LABEL: Record<string, { label: string; badge: string }> = {
  calmo:     { label: 'Calmo 😌',              badge: 'bg-green-100 text-green-800' },
  normal:    { label: 'Normal 🙂',             badge: 'bg-blue-100 text-blue-800' },
  agitado:   { label: 'Agitado 😤',            badge: 'bg-yellow-100 text-yellow-800' },
  agressivo: { label: 'Requer cuidado extra ⚠️', badge: 'bg-red-100 text-red-800' },
}

function vacinaStatus(dataVencimento: string | null): 'ok' | 'proxima' | 'vencida' {
  if (!dataVencimento) return 'ok'
  const [y, m, d] = dataVencimento.split('-').map(Number)
  const venc = new Date(y, m - 1, d)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  if (venc < hoje) return 'vencida'
  const limite = new Date(hoje); limite.setDate(limite.getDate() + 30)
  return venc <= limite ? 'proxima' : 'ok'
}

const VACINA_STATUS_CFG = {
  ok:      { label: 'Em dia',        badge: 'bg-green-100 text-green-700' },
  proxima: { label: 'Vence em breve', badge: 'bg-yellow-100 text-yellow-800' },
  vencida: { label: 'Vencida',       badge: 'bg-red-100 text-red-700' },
}

function fmtData(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

interface Props {
  params: Promise<{ slug: string; petId: string }>
}

export default async function ClientePetPage({ params }: Props) {
  const { slug, petId } = await params
  const session = await getClienteSession(slug)
  if (!session) redirect(`/cliente/${slug}/login`)

  const supabase = createAdminClient()

  const [
    { data: pet },
    { data: agendamentos },
    { data: prontuario },
    { data: vacinas },
  ] = await Promise.all([
    supabase
      .from('pets')
      .select('id, nome, especie, porte, raca, nascimento, observacoes')
      .eq('id', petId)
      .eq('cliente_id', session.id)
      .maybeSingle(),
    supabase
      .from('agendamentos')
      .select('id, data_hora, foto_path, agendamento_servicos(servico:servicos(nome))')
      .eq('pet_id', petId)
      .eq('status', 'concluido')
      .not('foto_path', 'is', null)
      .order('data_hora', { ascending: false }),
    supabase
      .from('prontuarios')
      .select('alergias, condicoes_especiais, medicamentos, nivel_agitacao, aceita_outros_animais, observacoes_comportamento')
      .eq('pet_id', petId)
      .maybeSingle(),
    supabase
      .from('vacinas')
      .select('id, nome, data_aplicacao, data_vencimento')
      .eq('pet_id', petId)
      .order('data_aplicacao', { ascending: false }),
  ])

  if (!pet) notFound()

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
    const meses = hoje.getMonth() - nasc.getMonth() + (hoje.getDate() < nasc.getDate() ? -1 : 0)
    const mesesTotal = anos * 12 + meses
    idadeLabel = mesesTotal < 12
      ? `${mesesTotal} ${mesesTotal === 1 ? 'mês' : 'meses'}`
      : `${anos} ${anos === 1 ? 'ano' : 'anos'}`
  }

  // Verifica se há algum dado de saúde/comportamento para exibir
  const temSaude = prontuario && (
    prontuario.alergias ||
    prontuario.condicoes_especiais ||
    prontuario.medicamentos
  )
  const temComportamento = prontuario && (
    prontuario.nivel_agitacao ||
    prontuario.observacoes_comportamento ||
    prontuario.aceita_outros_animais === false
  )
  const temProntuario = temSaude || temComportamento

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

        {/* ── Prontuário ── */}
        {temProntuario && (
          <section className="bg-[var(--color-card)] border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b bg-[var(--color-muted)]/30">
              <h2 className="text-sm font-bold text-[var(--color-foreground)]">
                🩺 Saúde &amp; Comportamento
              </h2>
            </div>

            <div className="divide-y divide-[var(--color-muted)]/60">
              {prontuario?.alergias && (
                <InfoRow
                  label="Alergias"
                  value={prontuario.alergias}
                  icon="⚠️"
                  valueClass="text-red-700"
                />
              )}
              {prontuario?.condicoes_especiais && (
                <InfoRow
                  label="Condições especiais"
                  value={prontuario.condicoes_especiais}
                  icon="💊"
                />
              )}
              {prontuario?.medicamentos && (
                <InfoRow
                  label="Medicamentos em uso"
                  value={prontuario.medicamentos}
                  icon="💉"
                />
              )}
              {prontuario?.nivel_agitacao && (
                <div className="px-5 py-3 flex items-start gap-3">
                  <span className="text-lg shrink-0 mt-0.5">🐾</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-1">
                      Comportamento
                    </p>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        AGITACAO_LABEL[prontuario.nivel_agitacao]?.badge ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {AGITACAO_LABEL[prontuario.nivel_agitacao]?.label ?? prontuario.nivel_agitacao}
                    </span>
                  </div>
                </div>
              )}
              {prontuario?.aceita_outros_animais === false && (
                <InfoRow
                  label="Convívio com animais"
                  value="Não se dá bem com outros animais"
                  icon="🚫"
                  valueClass="text-orange-700"
                />
              )}
              {prontuario?.observacoes_comportamento && (
                <InfoRow
                  label="Observações de comportamento"
                  value={prontuario.observacoes_comportamento}
                  icon="📝"
                />
              )}
            </div>
          </section>
        )}

        {/* ── Vacinas ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            💉 Vacinas
          </h2>

          {(vacinas ?? []).length === 0 ? (
            <div className="bg-[var(--color-card)] border rounded-2xl px-6 py-8 text-center">
              <p className="text-2xl mb-2">💉</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Nenhuma vacina registrada ainda.
              </p>
            </div>
          ) : (
            <div className="bg-[var(--color-card)] border rounded-2xl divide-y divide-[var(--color-muted)]/60 overflow-hidden">
              {(vacinas ?? []).map((v) => {
                const st = vacinaStatus(v.data_vencimento)
                const cfg = VACINA_STATUS_CFG[st]
                return (
                  <div key={v.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                        {v.nome}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Aplicada em {fmtData(v.data_aplicacao)}
                        {v.data_vencimento && ` · Vence em ${fmtData(v.data_vencimento)}`}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Galeria de fotos ── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
            📸 Galeria de atendimentos
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
                    <div className="aspect-square bg-gray-100">
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

function InfoRow({
  label,
  value,
  icon,
  valueClass = 'text-[var(--color-foreground)]',
}: {
  label: string
  value: string
  icon: string
  valueClass?: string
}) {
  return (
    <div className="px-5 py-3 flex items-start gap-3">
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className={`text-sm ${valueClass}`}>{value}</p>
      </div>
    </div>
  )
}
