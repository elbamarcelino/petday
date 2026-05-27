import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { telefone, slug } = await request.json()
  const digits = (telefone ?? '').replace(/\D/g, '')

  if (!slug || digits.length < 10) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: petshop } = await supabase
    .from('petshops')
    .select('id')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (!petshop) {
    return NextResponse.json({ error: 'Petshop não encontrado' }, { status: 404 })
  }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('petshop_id', petshop.id)
    .eq('telefone', digits)
    .maybeSingle()

  if (!cliente) {
    return NextResponse.json(
      { error: 'Telefone não encontrado. Confirme se o número está correto ou faça um agendamento primeiro.' },
      { status: 404 },
    )
  }

  const response = NextResponse.json({ nome: cliente.nome })
  response.cookies.set('cliente_id', cliente.id, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
  return response
}
