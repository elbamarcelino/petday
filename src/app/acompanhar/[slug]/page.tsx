import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { AcompanharClient } from './AcompanharClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function AcompanharPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: petshop } = await supabase
    .from('petshops')
    .select('id, nome')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!petshop) notFound()

  return <AcompanharClient slug={slug} petshopNome={petshop.nome} />
}
