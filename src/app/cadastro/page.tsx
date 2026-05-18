'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cadastrarPetshop } from './actions'

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

  const [nomePetshop, setNomePetshop] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [nomeDono, setNomeDono] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
