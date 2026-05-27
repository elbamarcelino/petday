'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/api/auth/callback?next=/nova-senha`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
  }

  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-lg p-8 text-center space-y-4">
          <span className="text-5xl">📧</span>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">E-mail enviado!</h2>
          <p className="text-sm text-gray-500">
            Verifique sua caixa de entrada e clique no link para redefinir sua senha.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius)] font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            Voltar ao login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mt-2">PetDay</h1>
          <p className="text-sm text-gray-500 mt-1">Recuperar senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              E-mail da conta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
              placeholder="seu@email.com"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)] bg-red-50 px-3 py-2 rounded-[var(--radius)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  )
}
