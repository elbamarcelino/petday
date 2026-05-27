import { cookies } from 'next/headers'
import { createAdminClient } from './supabase/admin'

export interface ClienteSession {
  id: string
  nome: string
  telefone: string
  petshopId: string
  petshopNome: string
}

export async function getClienteSession(slug: string): Promise<ClienteSession | null> {
  const cookieStore = await cookies()
  const clienteId = cookieStore.get('cliente_id')?.value
  if (!clienteId) return null

  const supabase = createAdminClient()

  const { data: petshop } = await supabase
    .from('petshops')
    .select('id, nome')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!petshop) return null

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome, telefone')
    .eq('id', clienteId)
    .eq('petshop_id', petshop.id)
    .maybeSingle()

  if (!cliente) return null

  return { ...cliente, petshopId: petshop.id, petshopNome: petshop.nome }
}
