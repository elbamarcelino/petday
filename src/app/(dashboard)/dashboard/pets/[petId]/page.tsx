import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProntuarioTab } from '@/components/ProntuarioTab'
import type { AgendamentoResumido } from '@/components/ProntuarioTab'
import type { Porte, StatusAgendamento, Prontuario, Vacina } from '@/types'

interface Props {
  params: Promise<{ petId: string }>
  searchParams: Promise<{ aba?: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PORTE_LABEL: Record<Porte, string> = { pequeno: 'Pequeno', medio: 'Médio', grande: 'Grande' }
const PORTE_BADGE: Record<Porte, string> = {
  pequeno: 'bg-green-100 text-green-700',
  medio: 'bg-blue-100 text-blue-700',
  grande: 'bg-orange-100 text-orange-700',
}
const STATUS_LABEL: Record<StatusAgendamento, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}
const STATUS_BADGE: Record<StatusAgendamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  confirmado: 'bg-blue-100 text-blue-700',
  em_andamento: 'bg-purple-100 text-purple-700',
  concluido: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

function petEmoji(especie: string) {
  const map: Record<string, string> = { cachorro: '🐶', gato: '🐱', ave: '🐦', coelho: '🐰' }
  return map[especie.toLowerCase()] ?? '🐾'
}

function formatarDataHora(dataHora: string) {
  const d = new Date(dataHora)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatarData(dataHora: string) {
  const d = new Date(dataHora)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarPreco(preco: number) {
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PetDetailPage({ params, searchParams }: Props) {
  const { petId } = await params
  const { aba } = await searchParams
  const abaAtiva = aba === 'prontuario' ? 'prontuario' : 'resumo'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const [
    { data: pet },
    { data: agendamentos },
    { data: prontuarioData },
    { data: vacinasData },
  ] = await Promise.all([
    supabase
      .from('pets')
      .select('*, cliente:clientes(id, nome, telefone, email)')
      .eq('id', petId)
      .single(),
    supabase
      .from('agendamentos')
      .select(`
        id, data_hora, status, preco_cobrado, observacoes, foto_path, created_at,
        agendamento_servicos(servico_id, servico:servicos(nome))
      `)
      .eq('pet_id', petId)
      .order('data_hora', { ascending: false }),
    supabase
      .from('prontuarios')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle(),
    supabase
      .from('vacinas')
      .select('*')
      .eq('pet_id', petId)
      .order('data_aplicacao', { ascending: false }),
  ])

  if (!pet) notFound()

  // Gerar URLs assinadas para fotos (1 hora de validade)
  const agendamentosComUrl = await Promise.all(
    (agendamentos ?? []).map(async (ag) => {
      if (!ag.foto_path) return { ...ag, fotoUrl: null as string | null }
      const { data } = await supabase.storage
        .from('fotos-pets')
        .createSignedUrl(ag.foto_path, 3600)
      return { ...ag, fotoUrl: data?.signedUrl ?? null }
    })
  )

  const fotos = agendamentosComUrl.filter((ag) => ag.fotoUrl !== null)
  const cliente = pet.cliente as { id: string; nome: string; telefone: string; email: string } | null

  const prontuario = prontuarioData as Prontuario | null
  const vacinas = (vacinasData ?? []) as Vacina[]

  const agendamentosResumidos: AgendamentoResumido[] = agendamentosComUrl.map((ag) => ({
    id: ag.id,
    data_hora: ag.data_hora,
    status: ag.status as StatusAgendamento,
    preco_cobrado: ag.preco_cobrado,
    observacoes: ag.observacoes ?? null,
    fotoUrl: ag.fotoUrl,
    servicos: (ag.agendamento_servicos as unknown as { servico?: { nome: string } }[])
      ?.map((as) => as.servico?.nome)
      .filter(Boolean)
      .join(', ') ?? '',
  }))

  const tabCls = (tab: string) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
      abaAtiva === tab
        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
        : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
    }`

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Back */}
      <Link
        href="/dashboard/pets"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para Pets
      </Link>

      {/* ── Pet header ── */}
      <div className="bg-[var(--color-card)] rounded-2xl border p-6 flex items-start gap-5">
        <span className="text-5xl leading-none">{petEmoji(pet.especie)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{pet.nome}</h1>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${PORTE_BADGE[pet.porte as Porte]}`}>
              {PORTE_LABEL[pet.porte as Porte]}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] capitalize mb-3">
            {pet.especie}{pet.raca ? ` · ${pet.raca}` : ''}
          </p>
          {cliente && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium text-[var(--color-foreground)]">{cliente.nome}</span>
              <span className="text-[var(--color-muted-foreground)]">·</span>
              <span className="text-[var(--color-muted-foreground)] font-mono text-xs">{cliente.telefone}</span>
            </div>
          )}
          {pet.observacoes && (
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)] rounded-xl px-3 py-2">
              {pet.observacoes}
            </p>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b flex gap-0">
        <Link href={`/dashboard/pets/${petId}`} className={tabCls('resumo')}>
          Resumo
        </Link>
        <Link href={`/dashboard/pets/${petId}?aba=prontuario`} className={tabCls('prontuario')}>
          Prontuário
        </Link>
      </div>

      {/* ── Tab: Resumo ── */}
      {abaAtiva === 'resumo' && (
        <div className="space-y-8">

          {/* Galeria de fotos */}
          {fotos.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
                Galeria de fotos
                <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                  {fotos.length} foto{fotos.length > 1 ? 's' : ''}
                </span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fotos.map((ag) => (
                  <a
                    key={ag.id}
                    href={ag.fotoUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl overflow-hidden border bg-[var(--color-muted)] aspect-square block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ag.fotoUrl!}
                      alt={`Foto de ${pet.nome} em ${formatarData(ag.data_hora)}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-white text-[11px] font-medium leading-tight">
                        {formatarData(ag.data_hora)}
                      </p>
                      <p className="text-white/70 text-[10px] truncate">
                        {(ag.agendamento_servicos as unknown as { servico?: { nome: string } }[])
                          ?.map((as) => as.servico?.nome)
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Histórico de agendamentos */}
          <section>
            <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
              Histórico de agendamentos
              <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                {agendamentosComUrl.length} agendamento{agendamentosComUrl.length !== 1 ? 's' : ''}
              </span>
            </h2>

            {agendamentosComUrl.length === 0 ? (
              <div className="bg-[var(--color-card)] rounded-2xl border px-6 py-12 text-center text-[var(--color-muted-foreground)] text-sm">
                Nenhum agendamento encontrado para este pet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {agendamentosComUrl.map((ag) => {
                  const servicos = (ag.agendamento_servicos as unknown as { servico?: { nome: string } }[])
                    ?.map((as) => as.servico?.nome)
                    .filter(Boolean)
                    .join(', ') ?? '—'
                  const status = ag.status as StatusAgendamento
                  return (
                    <div
                      key={ag.id}
                      className="bg-[var(--color-card)] rounded-2xl border px-5 py-4 flex items-center gap-4"
                    >
                      <div className="shrink-0 text-center bg-[var(--color-muted)] rounded-xl px-3 py-2 min-w-[56px]">
                        <p className="text-lg font-bold text-[var(--color-foreground)] leading-none">
                          {new Date(ag.data_hora).getDate().toString().padStart(2, '0')}
                        </p>
                        <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">
                          {new Date(ag.data_hora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                        </p>
                        <p className="text-[10px] text-[var(--color-muted-foreground)]">
                          {new Date(ag.data_hora).getFullYear()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">{servicos}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                          {formatarDataHora(ag.data_hora).split(',')[1]?.trim() ?? ''} · {formatarPreco(ag.preco_cobrado)}
                        </p>
                        {ag.observacoes && (
                          <p className="text-xs text-[var(--color-muted-foreground)] mt-1 truncate">
                            {ag.observacoes}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${STATUS_BADGE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                        {ag.fotoUrl && (
                          <a
                            href={ag.fotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-medium text-[var(--color-primary)] hover:underline"
                          >
                            📷 ver foto
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Tab: Prontuário ── */}
      {abaAtiva === 'prontuario' && (
        <ProntuarioTab
          petId={petId}
          prontuario={prontuario}
          vacinas={vacinas}
          agendamentos={agendamentosResumidos}
        />
      )}

    </div>
  )
}
