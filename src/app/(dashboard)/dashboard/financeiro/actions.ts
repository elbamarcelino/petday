'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUsuario } from '@/lib/petshop'

export type ActionState = { error?: string; success?: boolean } | null

export async function criarMovimento(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const usuario = await getUsuario()
  if (!usuario) return { error: 'Não autenticado.' }

  const valor = parseFloat(formData.get('valor') as string)
  if (isNaN(valor) || valor <= 0) return { error: 'Valor inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.from('caixa_movimentos').insert({
    petshop_id: usuario.petshop_id,
    tipo: formData.get('tipo') as string,
    descricao: (formData.get('descricao') as string).trim(),
    valor,
    data: formData.get('data') as string,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/financeiro/caixa')
  return { success: true }
}

export async function excluirMovimento(id: string): Promise<ActionState> {
  const usuario = await getUsuario()
  if (!usuario) return { error: 'Não autenticado.' }

  const supabase = await createClient()
  const { error } = await supabase.from('caixa_movimentos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/financeiro/caixa')
  return { success: true }
}
