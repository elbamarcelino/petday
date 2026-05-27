'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function formatarTelefone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

interface Props {
  slug: string
  petshopNome: string
}

export function LoginForm({ slug, petshopNome }: Props) {
  const router = useRouter()
  const [telefone, setTelefone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/cliente/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefone, slug }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Erro ao entrar.')
      setLoading(false)
      return
    }

    router.push(`/cliente/${slug}/dashboard`)
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mt-2">{petshopNome}</h1>
          <p className="text-sm text-gray-500 mt-1">Área do cliente</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Seu telefone / WhatsApp
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              required
              placeholder="(99) 99999-9999"
              className="w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Use o mesmo número cadastrado no agendamento.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || telefone.replace(/\D/g, '').length < 10}
            className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Ainda não fez um agendamento?{' '}
          <a href={`/agendar/${slug}`} className="text-[var(--color-primary)] hover:underline">
            Agendar agora
          </a>
        </p>
      </div>
    </main>
  )
}
