import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug') ?? ''
  const telefone = searchParams.get('telefone')?.replace(/\D/g, '') ?? ''

  if (!slug || telefone.length < 10) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
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
    .select('id')
    .eq('petshop_id', petshop.id)
    .eq('telefone', telefone)
    .maybeSingle()

  if (!cliente) {
    return NextResponse.json({ agendamentos: [] })
  }

  const { data: pets } = await supabase
    .from('pets')
    .select('id')
    .eq('cliente_id', cliente.id)

  if (!pets?.length) {
    return NextResponse.json({ agendamentos: [] })
  }

  const now = new Date()
  const hoje = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select(`
      id, data_hora, status, preco_cobrado,
      pet:pets(nome),
      agendamento_servicos(servico:servicos(nome))
    `)
    .eq('petshop_id', petshop.id)
    .in('pet_id', pets.map((p) => p.id))
    .gte('data_hora', `${hoje}T00:00:00`)
    .lte('data_hora', `${hoje}T23:59:59`)
    .order('data_hora', { ascending: true })

  return NextResponse.json({ agendamentos: agendamentos ?? [] })
}
