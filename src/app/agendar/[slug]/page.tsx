import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Servico } from '@/types'
import { AgendarClient } from './AgendarClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AgendarPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  // Busca petshop pelo slug
  const { data: petshop } = await supabase
    .from('petshops')
    .select('id, nome')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!petshop) notFound()

  const { data: servicos } = await supabase
    .from('servicos')
    .select('*')
    .eq('petshop_id', petshop.id)
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

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY ?? null

  return (
    <AgendarClient
      servicos={servicos as Servico[]}
      petshopId={petshop.id}
      petshopNome={petshop.nome}
      pixKey={pixKey}
    />
  )
}
