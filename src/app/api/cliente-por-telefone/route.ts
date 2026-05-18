import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const telefone = request.nextUrl.searchParams.get('telefone') ?? ''
  const petshopId = request.nextUrl.searchParams.get('petshopId') ?? ''
  const telefoneLimpo = telefone.replace(/\D/g, '')

  if (telefoneLimpo.length < 10 || !petshopId) {
    return Response.json({ nome: null })
  }

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('clientes')
    .select('nome')
    .eq('petshop_id', petshopId)
    .eq('telefone', telefoneLimpo)
    .maybeSingle()

  return Response.json({ nome: data?.nome ?? null })
}
