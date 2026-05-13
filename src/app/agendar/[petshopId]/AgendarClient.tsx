'use client'

import { useState, useTransition } from 'react'
import type { Servico } from '@/types'
import { criarAgendamentoPublico, getHorariosOcupados } from './actions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
  banho: 'Banho',
  tosa: 'Tosa',
  banho_e_tosa: 'Banho e Tosa',
  consulta: 'Consulta',
  vacina: 'Vacina',
}

const PORTE_LABEL: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// 08:00 → 17:30 in 30-min steps
const SLOT_TIMES: string[] = []
for (let min = 8 * 60; min <= 17 * 60 + 30; min += 30) {
  const h = Math.floor(min / 60)
  const m = min % 60
  SLOT_TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
}

function getProximosDias(n: number) {
  const dias: { date: string; dia: string; label: string }[] = []
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const cur = new Date(hoje)
  cur.setDate(cur.getDate() + 1)
  while (dias.length < n) {
    if (cur.getDay() !== 0) {
      const yyyy = cur.getFullYear()
      const mm = String(cur.getMonth() + 1).padStart(2, '0')
      const dd = String(cur.getDate()).padStart(2, '0')
      dias.push({
        date: `${yyyy}-${mm}-${dd}`,
        dia: DIAS_SEMANA[cur.getDay()],
        label: `${cur.getDate()} ${MESES[cur.getMonth()]}`,
      })
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dias
}

function formatarTelefone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatarPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataHora(date: string, time: string) {
  if (!date || !time) return ''
  const [yyyy, mm, dd] = date.split('-')
  return `${dd}/${mm}/${yyyy} às ${time}`
}

// ─── Shared UI pieces ────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-1">
      {children}
    </label>
  )
}

// ─── PIX copy button ─────────────────────────────────────────────────────────

function PixCard({ pixKey }: { pixKey: string }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(pixKey).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-4 mb-6 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-2">
        💳 Pagamento via PIX
      </p>
      <p className="text-xs text-green-700 mb-3">
        Você pode pagar antecipadamente usando a chave abaixo:
      </p>
      <div className="flex items-center gap-2">
        <span className="flex-1 font-mono text-sm bg-white border border-green-200 rounded-xl px-3 py-2 text-green-900 break-all">
          {pixKey}
        </span>
        <button
          type="button"
          onClick={copiar}
          className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold bg-green-600 text-white transition active:scale-95"
        >
          {copiado ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 4

interface Props {
  servicos: Servico[]
  petshopNome: string
  pixKey: string | null
}

export function AgendarClient({ servicos, petshopNome, pixKey }: Props) {
  const [step, setStep] = useState(1)

  // Step 1
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Step 2
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefone, setTelefone] = useState('')
  const [clienteEncontrado, setClienteEncontrado] = useState<string | null>(null)
  const [buscandoCliente, setBuscandoCliente] = useState(false)
  const [nomePet, setNomePet] = useState('')
  const [especie, setEspecie] = useState('cachorro')
  const [raca, setRaca] = useState('')
  const [porte, setPorte] = useState<'pequeno' | 'medio' | 'grande'>('medio')
  const [observacoes, setObservacoes] = useState('')

  // Step 3
  const dias = getProximosDias(14)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Submit
  const [submitError, setSubmitError] = useState('')
  const [isPending, startTransition] = useTransition()

  const servicosSelecionados = servicos.filter((s) => selectedIds.has(s.id))
  const precoTotal = servicosSelecionados.reduce((sum, s) => sum + s.preco, 0)

  function toggleServico(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleDateSelect(date: string) {
    setSelectedDate(date)
    setSelectedTime('')
    setLoadingSlots(true)
    try {
      const ocupados = await getHorariosOcupados(date)
      setHorariosOcupados(ocupados)
    } catch {
      setHorariosOcupados([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function handleSubmit() {
    setSubmitError('')
    startTransition(async () => {
      const result = await criarAgendamentoPublico({
        nomeCliente,
        telefone,
        nomePet,
        especie,
        raca: raca || undefined,
        porte,
        observacoes: observacoes || undefined,
        nomeServicos: servicosSelecionados.map((s) => s.nome),
        servicoIds: [...selectedIds],
        dataHora: `${selectedDate}T${selectedTime}:00`,
        precoTotal,
      })
      if (result?.error) {
        setSubmitError(result.error)
      } else {
        setStep(5)
      }
    })
  }

  async function buscarClientePorTelefone(tel: string) {
    const digits = tel.replace(/\D/g, '')
    if (digits.length < 10) return
    setBuscandoCliente(true)
    try {
      const res = await fetch(`/api/cliente-por-telefone?telefone=${digits}`)
      const json = await res.json()
      if (json.nome) {
        setNomeCliente(json.nome)
        setClienteEncontrado(json.nome)
      } else {
        setClienteEncontrado(null)
      }
    } catch {
      setClienteEncontrado(null)
    } finally {
      setBuscandoCliente(false)
    }
  }

  function resetar() {
    setStep(1)
    setSelectedIds(new Set())
    setNomeCliente('')
    setTelefone('')
    setClienteEncontrado(null)
    setNomePet('')
    setEspecie('cachorro')
    setRaca('')
    setPorte('medio')
    setObservacoes('')
    setSelectedDate('')
    setSelectedTime('')
  }

  // ── Progress bar ──
  const progress = step <= TOTAL_STEPS ? ((step - 1) / TOTAL_STEPS) * 100 : 100

  // ── Success screen ──
  if (step === 5) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          Agendamento confirmado!
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-1">
          {nomePet} — {servicosSelecionados.map((s) => s.nome).join(', ')}
        </p>
        <p className="text-[var(--color-muted-foreground)] mb-6">
          {formatarDataHora(selectedDate, selectedTime)}
        </p>
        <p className="text-sm text-[var(--color-muted-foreground)] bg-[var(--color-muted)] rounded-xl px-4 py-3 mb-6 max-w-sm">
          Você receberá uma confirmação pelo WhatsApp. Aguarde o contato da petshop.
        </p>

        {pixKey && (
          <div className="w-full max-w-sm">
            <PixCard pixKey={pixKey} />
          </div>
        )}

        <button
          onClick={resetar}
          className="text-sm text-[var(--color-primary)] font-medium underline"
        >
          Fazer outro agendamento
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[var(--color-border)] px-4 pt-5 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🐾</span>
            <div>
              <p className="font-bold text-[var(--color-foreground)] leading-tight">{petshopNome}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Agendamento online</p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--color-muted)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">
              {step}/{TOTAL_STEPS}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* ── STEP 1: Serviços ── */}
        {step === 1 && (
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
              Escolha o serviço
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
              Você pode selecionar mais de um.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {servicos.map((s) => {
                const selected = selectedIds.has(s.id)
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleServico(s.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition ${
                      selected
                        ? 'border-[var(--color-primary)] bg-purple-50'
                        : 'border-[var(--color-border)] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[var(--color-foreground)]">{s.nome}</span>
                          <span className="text-xs bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2 py-0.5 rounded-full">
                            {TIPO_LABEL[s.tipo] ?? s.tipo}
                          </span>
                        </div>
                        {s.descricao && (
                          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{s.descricao}</p>
                        )}
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                          ⏱ {s.duracao_minutos} min
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-lg font-bold text-[var(--color-primary)]">
                          {formatarPreco(s.preco)}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                            selected
                              ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                              : 'border-[var(--color-border)] bg-white'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-[var(--color-muted)] rounded-xl px-4 py-3 mb-5 flex justify-between items-center">
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {selectedIds.size} serviço{selectedIds.size > 1 ? 's' : ''} selecionado{selectedIds.size > 1 ? 's' : ''}
                </span>
                <span className="font-bold text-[var(--color-primary)]">{formatarPreco(precoTotal)}</span>
              </div>
            )}

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setStep(2)}
              className="w-full py-4 rounded-xl font-semibold text-white bg-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── STEP 2: Dados do pet e dono ── */}
        {step === 2 && (
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
              Seus dados e o pet
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
              Preencha as informações para continuar.
            </p>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 mb-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
                Seus dados
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <Label>WhatsApp *</Label>
                  <div className="relative">
                    <input
                      className={inputCls}
                      placeholder="(99) 99999-9999"
                      inputMode="tel"
                      value={telefone}
                      onChange={(e) => {
                        setTelefone(formatarTelefone(e.target.value))
                        setClienteEncontrado(null)
                      }}
                      onBlur={(e) => buscarClientePorTelefone(e.target.value)}
                    />
                    {buscandoCliente && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <span className="w-4 h-4 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin inline-block" />
                      </span>
                    )}
                  </div>
                </div>

                {clienteEncontrado && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 text-sm text-green-800">
                    <svg className="w-4 h-4 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Olá {clienteEncontrado.trim().split(' ')[0]}, encontramos seu cadastro!
                  </div>
                )}

                <div>
                  <Label>Seu nome *</Label>
                  <input
                    className={inputCls}
                    placeholder="Nome completo"
                    value={nomeCliente}
                    onChange={(e) => {
                      setNomeCliente(e.target.value)
                      setClienteEncontrado(null)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 mb-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-3">
                Dados do pet
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <Label>Nome do pet *</Label>
                  <input
                    className={inputCls}
                    placeholder="Ex: Rex, Mel, Bidu…"
                    value={nomePet}
                    onChange={(e) => setNomePet(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Espécie *</Label>
                  <select
                    className={inputCls}
                    value={especie}
                    onChange={(e) => setEspecie(e.target.value)}
                  >
                    <option value="cachorro">Cachorro</option>
                    <option value="gato">Gato</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <Label>Porte *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['pequeno', 'medio', 'grande'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPorte(p)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                          porte === p
                            ? 'border-[var(--color-primary)] bg-purple-50 text-[var(--color-primary)]'
                            : 'border-[var(--color-border)] text-[var(--color-foreground)]'
                        }`}
                      >
                        {PORTE_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Raça</Label>
                  <input
                    className={inputCls}
                    placeholder="Opcional"
                    value={raca}
                    onChange={(e) => setRaca(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Observações sobre o pet</Label>
                  <textarea
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Ex: é agitado, tem alergia a determinado produto, prefere groomer feminina…"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    maxLength={500}
                  />
                  {observacoes.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {observacoes.length}/500
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl font-semibold border-2 border-[var(--color-border)] text-[var(--color-foreground)] bg-white transition active:scale-[0.98]"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={
                  !nomeCliente.trim() ||
                  telefone.replace(/\D/g, '').length < 10 ||
                  !nomePet.trim()
                }
                onClick={() => setStep(3)}
                className="flex-[2] py-4 rounded-xl font-semibold text-white bg-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Data e hora ── */}
        {step === 3 && (
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
              Data e horário
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
              Escolha quando quer ser atendido.
            </p>

            {/* Date selector */}
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
              Selecione o dia
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
              {dias.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => handleDateSelect(d.date)}
                  className={`flex-shrink-0 flex flex-col items-center py-3 px-3.5 rounded-xl border-2 min-w-[64px] transition ${
                    selectedDate === d.date
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : 'border-[var(--color-border)] bg-white text-[var(--color-foreground)]'
                  }`}
                >
                  <span className="text-xs font-medium opacity-80">{d.dia}</span>
                  <span className="text-base font-bold leading-tight">{d.label.split(' ')[0]}</span>
                  <span className="text-xs opacity-80">{d.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-muted-foreground)] mb-2">
                  Selecione o horário
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-8">
                    <div className="w-7 h-7 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {SLOT_TIMES.map((time) => {
                      const ocupado = horariosOcupados.includes(time)
                      const selecionado = selectedTime === time
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={ocupado}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                            ocupado
                              ? 'border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)] opacity-40 cursor-not-allowed line-through'
                              : selecionado
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                              : 'border-[var(--color-border)] bg-white text-[var(--color-foreground)] active:scale-95'
                          }`}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {!selectedDate && (
              <div className="text-center py-8 text-[var(--color-muted-foreground)] text-sm">
                Selecione um dia para ver os horários disponíveis.
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl font-semibold border-2 border-[var(--color-border)] text-[var(--color-foreground)] bg-white transition active:scale-[0.98]"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(4)}
                className="flex-[2] py-4 rounded-xl font-semibold text-white bg-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-[0.98]"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Confirmar ── */}
        {step === 4 && (
          <div>
            <h1 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
              Confirmar agendamento
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
              Revise os dados antes de confirmar.
            </p>

            <div className="bg-white rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] mb-6 overflow-hidden">
              <Row label="Petshop" value={petshopNome} />
              <Row label="Serviço(s)" value={servicosSelecionados.map((s) => s.nome).join(', ')} />
              <Row label="Valor total" value={formatarPreco(precoTotal)} highlight />
              <Row label="Data e hora" value={formatarDataHora(selectedDate, selectedTime)} />
              <Row label="Pet" value={`${nomePet} (${PORTE_LABEL[porte]}${raca ? ` · ${raca}` : ''})`} />
              <Row label="Dono(a)" value={nomeCliente} />
              <Row label="WhatsApp" value={telefone} />
              {observacoes.trim() && (
                <Row label="Observações" value={observacoes.trim()} />
              )}
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isPending}
                className="flex-1 py-4 rounded-xl font-semibold border-2 border-[var(--color-border)] text-[var(--color-foreground)] bg-white transition active:scale-[0.98] disabled:opacity-40"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="flex-[2] py-4 rounded-xl font-semibold text-white bg-[var(--color-primary)] disabled:opacity-70 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                    Aguarde…
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4 px-4 py-3">
      <span className="text-sm text-[var(--color-muted-foreground)] shrink-0">{label}</span>
      <span
        className={`text-sm text-right font-medium ${
          highlight ? 'text-[var(--color-primary)] font-bold text-base' : 'text-[var(--color-foreground)]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
