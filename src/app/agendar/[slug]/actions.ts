'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type PublicBookingResult = { error?: string; success?: boolean } | null

type DadosAgendamento = {
  petshopId: string
  nomeCliente: string
  telefone: string
  nomePet: string
  especie: string
  raca?: string
  porte: 'pequeno' | 'medio' | 'grande'
  observacoes?: string
  nomeServicos: string[]
  servicoIds: string[]
  dataHora: string
  precoTotal: number
}

// ─── Server action ────────────────────────────────────────────────────────────

export async function criarAgendamentoPublico(
  dados: DadosAgendamento
): Promise<PublicBookingResult> {
  const supabase = createAdminClient()

  const telefoneLimpo = dados.telefone.replace(/\D/g, '')
  if (telefoneLimpo.length < 10) return { error: 'Telefone inválido.' }
  if (!dados.servicoIds.length) return { error: 'Selecione ao menos um serviço.' }
  if (!dados.nomeCliente.trim()) return { error: 'Informe seu nome.' }
  if (!dados.nomePet.trim()) return { error: 'Informe o nome do pet.' }

  // Busca ou cria cliente dentro do petshop
  let clienteId: string

  const { data: clienteExistente } = await supabase
    .from('clientes')
    .select('id')
    .eq('petshop_id', dados.petshopId)
    .eq('telefone', telefoneLimpo)
    .maybeSingle()

  if (clienteExistente) {
    clienteId = clienteExistente.id
  } else {
    const { data: novoCliente, error: erroCliente } = await supabase
      .from('clientes')
      .insert({
        petshop_id: dados.petshopId,
        nome: dados.nomeCliente.trim(),
        email: `${telefoneLimpo}@petday.agendamento`,
        telefone: telefoneLimpo,
      })
      .select('id')
      .single()

    if (erroCliente || !novoCliente) {
      return { error: 'Erro ao cadastrar cliente. Tente novamente.' }
    }
    clienteId = novoCliente.id
  }

  // Busca ou cria pet dentro do petshop
  let petId: string

  const { data: petExistente } = await supabase
    .from('pets')
    .select('id')
    .eq('petshop_id', dados.petshopId)
    .eq('cliente_id', clienteId)
    .ilike('nome', dados.nomePet.trim())
    .maybeSingle()

  if (petExistente) {
    petId = petExistente.id
  } else {
    const { data: novoPet, error: erroPet } = await supabase
      .from('pets')
      .insert({
        petshop_id: dados.petshopId,
        cliente_id: clienteId,
        nome: dados.nomePet.trim(),
        especie: dados.especie,
        raca: dados.raca?.trim() || null,
        porte: dados.porte,
      })
      .select('id')
      .single()

    if (erroPet || !novoPet) {
      return { error: 'Erro ao cadastrar pet. Tente novamente.' }
    }
    petId = novoPet.id
  }

  // Cria agendamento
  const { data: agendamento, error: erroAg } = await supabase
    .from('agendamentos')
    .insert({
      petshop_id: dados.petshopId,
      pet_id: petId,
      data_hora: dados.dataHora,
      status: 'pendente',
      preco_cobrado: dados.precoTotal,
      observacoes: dados.observacoes?.trim() || null,
    })
    .select('id')
    .single()

  if (erroAg || !agendamento) {
    return { error: 'Erro ao criar agendamento. Tente novamente.' }
  }

  // Vincula serviços
  const { error: erroServicos } = await supabase
    .from('agendamento_servicos')
    .insert(
      dados.servicoIds.map((id) => ({
        agendamento_id: agendamento.id,
        servico_id: id,
      }))
    )

  if (erroServicos) {
    return { error: 'Erro ao vincular serviços. Tente novamente.' }
  }

  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}

export async function getHorariosOcupados(petshopId: string, data: string): Promise<string[]> {
  const supabase = createAdminClient()

  const { data: agendamentos } = await supabase
    .from('agendamentos')
    .select('data_hora')
    .eq('petshop_id', petshopId)
    .gte('data_hora', `${data}T00:00:00`)
    .lte('data_hora', `${data}T23:59:59`)
    .not('status', 'eq', 'cancelado')

  return (agendamentos ?? [])
    .map((a) => {
      const match = a.data_hora.match(/T(\d{2}:\d{2})/)
      return match ? match[1] : ''
    })
    .filter(Boolean)
}
