'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { salvarProntuario, criarVacina, excluirVacina } from '@/app/(dashboard)/dashboard/actions'
import type { Prontuario, Vacina, StatusAgendamento, NivelAgitacao } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NIVEL_LABEL: Record<NivelAgitacao, string> = {
  calmo: 'Calmo',
  normal: 'Normal',
  agitado: 'Agitado',
  agressivo: 'Agressivo',
}

const NIVEL_BADGE: Record<NivelAgitacao, string> = {
  calmo: 'bg-green-100 text-green-700',
  normal: 'bg-blue-100 text-blue-700',
  agitado: 'bg-amber-100 text-amber-700',
  agressivo: 'bg-red-100 text-red-700',
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

function vacinaStatus(dataVencimento: string | null): 'ok' | 'proxima' | 'vencida' {
  if (!dataVencimento) return 'ok'
  const [y, m, d] = dataVencimento.split('-').map(Number)
  const vencimento = new Date(y, m - 1, d)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (vencimento < hoje) return 'vencida'
  const limite = new Date(hoje)
  limite.setDate(limite.getDate() + 30)
  if (vencimento <= limite) return 'proxima'
  return 'ok'
}

function formatarData(iso: string) {
  const [y, m, d] = iso.includes('T') ? iso.split('T')[0].split('-').map(Number) : iso.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AgendamentoResumido {
  id: string
  data_hora: string
  status: StatusAgendamento
  preco_cobrado: number
  observacoes: string | null
  fotoUrl: string | null
  servicos: string
}

interface Props {
  petId: string
  prontuario: Prontuario | null
  vacinas: Vacina[]
  agendamentos: AgendamentoResumido[]
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-[var(--color-card)] rounded-2xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[var(--color-foreground)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="text-sm mt-0.5">{children}</dd>
    </div>
  )
}

function Vazio() {
  return <span className="text-[var(--color-muted-foreground)]">—</span>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProntuarioTab({ petId, prontuario, vacinas, agendamentos }: Props) {
  const router = useRouter()

  const [editandoProntuario, setEditandoProntuario] = useState(false)
  const [prontuarioError, setProntuarioError] = useState<string | null>(null)
  const [isPendingProntuario, startProntuario] = useTransition()

  const [adicionandoVacina, setAdicionandoVacina] = useState(false)
  const [vacinaError, setVacinaError] = useState<string | null>(null)
  const [isPendingVacina, startVacina] = useTransition()
  const vacinaFormRef = useRef<HTMLFormElement>(null)

  const [deletingVacinaId, setDeletingVacinaId] = useState<string | null>(null)
  const [isPendingDelete, startDelete] = useTransition()

  function handleSalvarProntuario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startProntuario(async () => {
      const result = await salvarProntuario(petId, null, formData)
      if (result?.error) {
        setProntuarioError(result.error)
      } else {
        setEditandoProntuario(false)
        setProntuarioError(null)
        router.refresh()
      }
    })
  }

  function handleCriarVacina(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startVacina(async () => {
      const result = await criarVacina(petId, null, formData)
      if (result?.error) {
        setVacinaError(result.error)
      } else {
        setAdicionandoVacina(false)
        setVacinaError(null)
        vacinaFormRef.current?.reset()
        router.refresh()
      }
    })
  }

  function handleDeleteVacina(id: string) {
    startDelete(async () => {
      await excluirVacina(id, petId)
      setDeletingVacinaId(null)
      router.refresh()
    })
  }

  const inputCls = 'w-full text-sm border rounded-[var(--radius)] px-3 py-2 bg-[var(--color-background)]'
  const textareaCls = `${inputCls} resize-none`

  return (
    <div className="space-y-6">

      {/* ── Saúde & Comportamento ── */}
      <Section
        title="Saúde & Comportamento"
        action={
          !editandoProntuario ? (
            <button
              onClick={() => { setProntuarioError(null); setEditandoProntuario(true) }}
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              Editar
            </button>
          ) : undefined
        }
      >
        {editandoProntuario ? (
          <form onSubmit={handleSalvarProntuario} className="space-y-6">

            {/* Saúde */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                Saúde
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Alergias</label>
                  <textarea
                    name="alergias"
                    rows={2}
                    defaultValue={prontuario?.alergias ?? ''}
                    placeholder="ex: amendoim, frango..."
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Condições especiais</label>
                  <textarea
                    name="condicoes_especiais"
                    rows={2}
                    defaultValue={prontuario?.condicoes_especiais ?? ''}
                    placeholder="ex: diabetes, problemas cardíacos..."
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Medicamentos em uso</label>
                  <textarea
                    name="medicamentos"
                    rows={2}
                    defaultValue={prontuario?.medicamentos ?? ''}
                    placeholder="ex: Frontline, antibiótico..."
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Veterinário responsável</label>
                  <input
                    type="text"
                    name="veterinario"
                    defaultValue={prontuario?.veterinario ?? ''}
                    placeholder="Nome do veterinário"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Comportamento */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                Comportamento
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nível de agitação</label>
                  <select
                    name="nivel_agitacao"
                    defaultValue={prontuario?.nivel_agitacao ?? ''}
                    className={inputCls}
                  >
                    <option value="">Não informado</option>
                    <option value="calmo">Calmo</option>
                    <option value="normal">Normal</option>
                    <option value="agitado">Agitado</option>
                    <option value="agressivo">Agressivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Aceita outros animais?</label>
                  <select
                    name="aceita_outros_animais"
                    defaultValue={prontuario === null || prontuario.aceita_outros_animais ? 'true' : 'false'}
                    className={inputCls}
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Observações de comportamento</label>
                  <textarea
                    name="observacoes_comportamento"
                    rows={2}
                    defaultValue={prontuario?.observacoes_comportamento ?? ''}
                    placeholder="Informações adicionais sobre o comportamento..."
                    className={textareaCls}
                  />
                </div>
              </div>
            </div>

            {prontuarioError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[var(--radius)]">
                {prontuarioError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setEditandoProntuario(false); setProntuarioError(null) }}
                className="px-4 py-2 text-sm border rounded-[var(--radius)] hover:bg-[var(--color-muted)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPendingProntuario}
                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isPendingProntuario ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Saúde — view */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                Saúde
              </p>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Alergias">
                  {prontuario?.alergias || <Vazio />}
                </InfoRow>
                <InfoRow label="Condições especiais">
                  {prontuario?.condicoes_especiais || <Vazio />}
                </InfoRow>
                <InfoRow label="Medicamentos em uso">
                  {prontuario?.medicamentos || <Vazio />}
                </InfoRow>
                <InfoRow label="Veterinário responsável">
                  {prontuario?.veterinario || <Vazio />}
                </InfoRow>
              </dl>
            </div>

            {/* Comportamento — view */}
            <div className="pt-4 border-t">
              <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                Comportamento
              </p>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Nível de agitação">
                  {prontuario?.nivel_agitacao ? (
                    <span className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold ${NIVEL_BADGE[prontuario.nivel_agitacao]}`}>
                      {NIVEL_LABEL[prontuario.nivel_agitacao]}
                    </span>
                  ) : <Vazio />}
                </InfoRow>
                <InfoRow label="Aceita outros animais">
                  {prontuario === null ? (
                    <Vazio />
                  ) : prontuario.aceita_outros_animais ? (
                    <span className="font-medium text-green-700">Sim</span>
                  ) : (
                    <span className="font-medium text-red-600">Não</span>
                  )}
                </InfoRow>
                {prontuario?.observacoes_comportamento && (
                  <div className="md:col-span-2">
                    <dt className="text-xs text-[var(--color-muted-foreground)]">Observações</dt>
                    <dd className="text-sm mt-0.5">{prontuario.observacoes_comportamento}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
      </Section>

      {/* ── Vacinas ── */}
      <Section
        title={
          <>
            Vacinas
            {vacinas.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                {vacinas.length}
              </span>
            )}
          </>
        }
        action={
          <button
            onClick={() => { setVacinaError(null); setAdicionandoVacina(v => !v) }}
            className="text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            {adicionandoVacina ? 'Cancelar' : '+ Adicionar'}
          </button>
        }
      >
        {adicionandoVacina && (
          <form
            ref={vacinaFormRef}
            onSubmit={handleCriarVacina}
            className="mb-6 p-4 bg-[var(--color-muted)] rounded-xl space-y-3"
          >
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
              Nova vacina
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium mb-1">Nome da vacina *</label>
                <input
                  type="text"
                  name="nome"
                  required
                  placeholder="ex: Antirrábica, V10..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Data de aplicação *</label>
                <input
                  type="date"
                  name="data_aplicacao"
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Data de vencimento</label>
                <input
                  type="date"
                  name="data_vencimento"
                  className={inputCls}
                />
              </div>
            </div>

            {vacinaError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[var(--radius)]">
                {vacinaError}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPendingVacina}
                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-[var(--radius)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isPendingVacina ? 'Salvando...' : 'Salvar vacina'}
              </button>
            </div>
          </form>
        )}

        {vacinas.length === 0 && !adicionandoVacina ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">
            Nenhuma vacina registrada.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {vacinas.map((v) => {
              const status = vacinaStatus(v.data_vencimento)
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-[var(--color-background)]"
                >
                  {/* Status dot */}
                  <span
                    className={`shrink-0 w-2.5 h-2.5 rounded-full ${
                      status === 'vencida' ? 'bg-red-500' :
                      status === 'proxima' ? 'bg-amber-400' :
                      'bg-green-500'
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{v.nome}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      Aplicada em {formatarData(v.data_aplicacao)}
                      {v.data_vencimento && ` · Vence em ${formatarData(v.data_vencimento)}`}
                    </p>
                  </div>

                  {/* Alert badge */}
                  {status !== 'ok' && (
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        status === 'vencida'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {status === 'vencida' ? 'Vencida' : 'Vence em breve'}
                    </span>
                  )}

                  {/* Delete */}
                  {deletingVacinaId === v.id ? (
                    <div className="shrink-0 flex items-center gap-1">
                      <span className="text-xs text-[var(--color-muted-foreground)]">Confirmar?</span>
                      <button
                        onClick={() => handleDeleteVacina(v.id)}
                        disabled={isPendingDelete}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-[var(--radius)] hover:bg-red-600 disabled:opacity-50"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setDeletingVacinaId(null)}
                        className="px-2 py-1 text-xs font-medium border rounded-[var(--radius)] hover:bg-[var(--color-muted)]"
                      >
                        Não
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingVacinaId(v.id)}
                      className="shrink-0 text-xs text-red-500 hover:underline"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Histórico de atendimentos ── */}
      <Section
        title={
          <>
            Histórico de atendimentos
            {agendamentos.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                {agendamentos.length}
              </span>
            )}
          </>
        }
      >
        {agendamentos.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-6">
            Nenhum atendimento registrado.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {agendamentos.map((ag) => (
              <div
                key={ag.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl border bg-[var(--color-background)]"
              >
                {/* Data */}
                <div className="shrink-0 text-center bg-[var(--color-muted)] rounded-xl px-3 py-2 min-w-[52px]">
                  <p className="text-base font-bold text-[var(--color-foreground)] leading-none">
                    {new Date(ag.data_hora).getDate().toString().padStart(2, '0')}
                  </p>
                  <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">
                    {new Date(ag.data_hora).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    {new Date(ag.data_hora).getFullYear()}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{ag.servicos || '—'}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                    {formatarDataHora(ag.data_hora).split(',')[1]?.trim() ?? ''} · {formatarPreco(ag.preco_cobrado)}
                  </p>
                  {ag.observacoes && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1 truncate">
                      {ag.observacoes}
                    </p>
                  )}
                </div>

                {/* Status + foto */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold ${STATUS_BADGE[ag.status]}`}>
                    {STATUS_LABEL[ag.status]}
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
            ))}
          </div>
        )}
      </Section>

    </div>
  )
}
