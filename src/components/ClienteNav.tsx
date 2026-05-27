'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
  slug: string
  petshopNome: string
  clienteNome: string
}

export function ClienteNav({ slug, petshopNome, clienteNome }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/cliente/logout', { method: 'POST' })
    router.push(`/cliente/${slug}/login`)
  }

  const links = [
    { href: `/cliente/${slug}/dashboard`, label: 'Início', icon: '🏠' },
    { href: `/cliente/${slug}/historico`, label: 'Histórico', icon: '📋' },
  ]

  return (
    <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10 shadow-sm">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">🐾</span>
          <div className="min-w-0">
            <p className="font-bold text-[var(--color-foreground)] text-sm leading-tight truncate">
              {petshopNome}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] truncate">
              Olá, {clienteNome.split(' ')[0]}!
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                }`}
              >
                <span>{l.icon}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Sair</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
