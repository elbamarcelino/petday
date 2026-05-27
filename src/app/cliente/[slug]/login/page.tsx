import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClienteLoginPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: petshop } = await supabase
    .from('petshops')
    .select('nome')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!petshop) notFound()

  return <LoginForm slug={slug} petshopNome={petshop.nome} />
}
