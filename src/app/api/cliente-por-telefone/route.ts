import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const telefone = request.nextUrl.searchParams.get('telefone') ?? ''
  const telefoneLimpo = telefone.replace(/\D/g, '')

  if (telefoneLimpo.length < 10) {
    return Response.json({ nome: null })
  }

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('clientes')
    .select('nome')
    .eq('telefone', telefoneLimpo)
    .maybeSingle()

  return Response.json({ nome: data?.nome ?? null })
}
