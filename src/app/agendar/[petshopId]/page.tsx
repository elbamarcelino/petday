import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Servico } from '@/types'
import { AgendarClient } from './AgendarClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ petshopId: string }>
}

export default async function AgendarPage({ params }: Props) {
  const { petshopId } = await params

  // Validate slug against env var (if configured).
  // If NEXT_PUBLIC_BOOKING_SLUG is not set, any slug works (dev-friendly).
  const slug = process.env.NEXT_PUBLIC_BOOKING_SLUG
  if (slug && petshopId !== slug) {
    notFound()
  }

  const supabase = createAdminClient()
  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('ativo', true)
    .order('preco', { ascending: true })

  if (!servicos?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">🐾</p>
          <p className="text-[var(--color-muted-foreground)]">
            Nenhum serviço disponível no momento.
          </p>
        </div>
      </div>
    )
  }

  const petshopNome = process.env.NEXT_PUBLIC_PETSHOP_NOME ?? 'PetDay'
  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? null

  return (
    <AgendarClient
      servicos={servicos as Servico[]}
      petshopNome={petshopNome}
      pixKey={pixKey}
    />
  )
}
