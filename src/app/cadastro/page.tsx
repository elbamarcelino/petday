'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cadastrarPetshop } from './actions'
import { createClient } from '@/lib/supabase/client'

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CadastroPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingGoogle, setLoadingGoogle] = useState(false)

  const [nomePetshop, setNomePetshop] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [nomeDono, setNomeDono] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleGoogle() {
    setLoadingGoogle(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  function handleNomePetshop(value: string) {
    setNomePetshop(value)
    if (!slugEditado) setSlug(gerarSlug(value))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await cadastrarPetshop({ nomePetshop, slug, nomeDono, email, senha })
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-lg p-8 text-center space-y-4">
          <span className="text-5xl">🎉</span>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Petshop criado!</h2>
          <p className="text-sm text-gray-500">
            Seu petshop está pronto. Faça login para começar.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius)] font-semibold hover:opacity-90 transition-opacity"
          >
            Ir para o login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-background)] py-10">
      <div className="w-full max-w-md bg-[var(--color-card)] rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <span className="text-4xl">🐾</span>
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mt-2">PetDay</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastre seu petshop</p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-[var(--radius)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loadingGoogle ? 'Redirecionando...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ou cadastre com e-mail</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Dados do petshop
            </legend>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Nome do petshop *
              </label>
              <input
                type="text"
                required
                value={nomePetshop}
                onChange={(e) => handleNomePetshop(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                placeholder="Ex: Pet Feliz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Slug (URL de agendamento) *
              </label>
              <div className="flex items-center border rounded-[var(--radius)] bg-white focus-within:ring-2 focus-within:ring-[var(--color-primary)] overflow-hidden">
                <span className="px-3 text-xs text-gray-400 border-r py-2.5 bg-gray-50 whitespace-nowrap">
                  /agendar/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEditado(true) }}
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white"
                  placeholder="pet-feliz"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Letras minúsculas, números e hifens. Clientes usarão essa URL.
              </p>
            </div>
          </fieldset>

          <fieldset className="space-y-3 pt-2">
            <legend className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              Responsável / acesso
            </legend>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Seu nome *
              </label>
              <input
                type="text"
                required
                value={nomeDono}
                onChange={(e) => setNomeDono(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-[var(--radius)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-white"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </fieldset>

          {error && (
            <p className="text-sm text-[var(--color-danger)] bg-red-50 px-3 py-2 rounded-[var(--radius)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 bg-[var(--color-primary)] text-white rounded-[var(--radius)] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Criando...' : 'Criar petshop'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
