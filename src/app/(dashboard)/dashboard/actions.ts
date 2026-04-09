'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error?: string; success?: boolean } | null

// ─── CLIENTES ────────────────────────────────────────────────────

export async function criarCliente(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('clientes').insert({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    telefone: formData.get('telefone') as string,
    endereco: (formData.get('endereco') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function editarCliente(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('clientes').update({
    nome: formData.get('nome') as string,
    email: formData.get('email') as string,
    telefone: formData.get('telefone') as string,
    endereco: (formData.get('endereco') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

export async function excluirCliente(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/clientes')
  return { success: true }
}

// ─── PETS ────────────────────────────────────────────────────────

export async function criarPet(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('pets').insert({
    cliente_id: formData.get('cliente_id') as string,
    nome: formData.get('nome') as string,
    especie: formData.get('especie') as string,
    raca: (formData.get('raca') as string) || null,
    porte: formData.get('porte') as string,
    nascimento: (formData.get('nascimento') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pets')
  return { success: true }
}

export async function editarPet(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('pets').update({
    cliente_id: formData.get('cliente_id') as string,
    nome: formData.get('nome') as string,
    especie: formData.get('especie') as string,
    raca: (formData.get('raca') as string) || null,
    porte: formData.get('porte') as string,
    nascimento: (formData.get('nascimento') as string) || null,
    observacoes: (formData.get('observacoes') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/pets')
  return { success: true }
}

export async function excluirPet(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('pets').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/pets')
  return { success: true }
}

// ─── SERVIÇOS ────────────────────────────────────────────────────

export async function criarServico(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('servicos').insert({
    nome: formData.get('nome') as string,
    tipo: formData.get('tipo') as string,
    descricao: (formData.get('descricao') as string) || null,
    preco: parseFloat(formData.get('preco') as string),
    duracao_minutos: parseInt(formData.get('duracao_minutos') as string, 10),
    ativo: formData.get('ativo') === 'true',
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicos')
  return { success: true }
}

export async function editarServico(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('servicos').update({
    nome: formData.get('nome') as string,
    tipo: formData.get('tipo') as string,
    descricao: (formData.get('descricao') as string) || null,
    preco: parseFloat(formData.get('preco') as string),
    duracao_minutos: parseInt(formData.get('duracao_minutos') as string, 10),
    ativo: formData.get('ativo') === 'true',
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicos')
  return { success: true }
}

export async function excluirServico(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('servicos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/servicos')
  return { success: true }
}

// ─── AGENDAMENTOS ────────────────────────────────────────────────

export async function criarAgendamento(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const servicoIds = formData.getAll('servico_ids') as string[]
  if (servicoIds.length === 0) return { error: 'Selecione ao menos um serviço.' }

  const { data: agendamento, error } = await supabase
    .from('agendamentos')
    .insert({
      pet_id: formData.get('pet_id') as string,
      data_hora: formData.get('data_hora') as string,
      status: formData.get('status') as string,
      observacoes: (formData.get('observacoes') as string) || null,
      preco_cobrado: parseFloat(formData.get('preco_cobrado') as string),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const { error: junctionError } = await supabase
    .from('agendamento_servicos')
    .insert(servicoIds.map((sid) => ({ agendamento_id: agendamento.id, servico_id: sid })))

  if (junctionError) {
    await supabase.from('agendamentos').delete().eq('id', agendamento.id)
    return { error: junctionError.message }
  }

  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}

export async function editarAgendamento(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const servicoIds = formData.getAll('servico_ids') as string[]
  if (servicoIds.length === 0) return { error: 'Selecione ao menos um serviço.' }

  const { error } = await supabase.from('agendamentos').update({
    pet_id: formData.get('pet_id') as string,
    data_hora: formData.get('data_hora') as string,
    status: formData.get('status') as string,
    observacoes: (formData.get('observacoes') as string) || null,
    preco_cobrado: parseFloat(formData.get('preco_cobrado') as string),
  }).eq('id', id)

  if (error) return { error: error.message }

  await supabase.from('agendamento_servicos').delete().eq('agendamento_id', id)
  const { error: junctionError } = await supabase
    .from('agendamento_servicos')
    .insert(servicoIds.map((sid) => ({ agendamento_id: id, servico_id: sid })))

  if (junctionError) return { error: junctionError.message }

  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}

export async function excluirAgendamento(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('agendamentos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}

export async function atualizarStatusAgendamento(id: string, status: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}

function formatarTelefoneZAPI(telefone: string): string | null {
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return null
  // Já com DDI 55: 55 + DDD (2) + número (8-9) = 12 ou 13 dígitos
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits
  // Sem DDI: DDD (2) + número (8-9) = 10 ou 11 dígitos
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return null
}

export async function enviarFotoWhatsApp(
  agendamentoId: string,
  storagePath: string,
  _telefone: string,
  mensagem: string,
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // 1. Buscar telefone do cliente diretamente no banco (fonte confiável)
  const { data: agendamento, error: agendamentoError } = await supabase
    .from('agendamentos')
    .select('pet:pets(cliente:clientes(telefone))')
    .eq('id', agendamentoId)
    .single()
  if (agendamentoError || !agendamento) {
    return { error: `Erro ao buscar agendamento: ${agendamentoError?.message ?? 'não encontrado'}` }
  }
  const pet = agendamento.pet as { cliente?: { telefone?: string } } | null
  const telefone = pet?.cliente?.telefone ?? ''

  // 2. URL assinada (5 min) — funciona com bucket público ou privado
  const { data: signed, error: signedError } = await supabase.storage
    .from('fotos-pets')
    .createSignedUrl(storagePath, 300)
  if (signedError || !signed) {
    return { error: `Erro ao gerar URL da foto: ${signedError?.message ?? 'desconhecido'}` }
  }

  // 3. Marcar como concluído
  const { error: statusError } = await supabase
    .from('agendamentos')
    .update({ status: 'concluido' })
    .eq('id', agendamentoId)
  if (statusError) return { error: statusError.message }

  // 4. Enviar via Z-API
  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const clientToken = process.env.ZAPI_CLIENT_TOKEN
  if (!instanceId || !token || !clientToken) {
    return { error: 'Credenciais Z-API não configuradas (ZAPI_INSTANCE_ID / ZAPI_TOKEN / ZAPI_CLIENT_TOKEN).' }
  }

  const telefoneFormatado = formatarTelefoneZAPI(telefone)
  if (!telefoneFormatado) {
    return { error: `Telefone inválido: "${telefone}". Corrija o cadastro do cliente.` }
  }

  const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-image`
  let response: Response
  try {
    response = await fetch(zapiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify({
        phone: telefoneFormatado,
        image: signed.signedUrl,
        caption: mensagem,
      }),
    })
  } catch (err) {
    return { error: `Falha de rede ao chamar Z-API: ${err instanceof Error ? err.message : String(err)}` }
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    return { error: `Z-API respondeu ${response.status}: ${body}` }
  }

  revalidatePath('/dashboard/agendamentos')
  return { success: true }
}
