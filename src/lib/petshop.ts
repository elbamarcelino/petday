import { createClient } from '@/lib/supabase/server'

export interface UsuarioComPetshop {
  id: string
  petshop_id: string
  nome: string
  role: string
  petshop: {
    nome: string
    slug: string
    plano: string
  }
}

export async function getUsuario(): Promise<UsuarioComPetshop | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('usuarios')
    .select('id, petshop_id, nome, role, petshop:petshops(nome, slug, plano)')
    .eq('id', user.id)
    .single()

  return data as UsuarioComPetshop | null
}
