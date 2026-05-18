'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type CadastroResult = { error?: string; success?: boolean } | null

export async function cadastrarPetshop(
  _prev: CadastroResult,
  formData: FormData
): Promise<CadastroResult> {
  const nomePetshop = (formData.get('nome_petshop') as string).trim()
  const slug = (formData.get('slug') as string).trim().toLowerCase()
  const nomeDono = (formData.get('nome_dono') as string).trim()
  const email = (formData.get('email') as string).trim()
  const senha = formData.get('senha') as string

  if (!nomePetshop || !slug || !nomeDono || !email || !senha) {
    return { error: 'Preencha todos os campos.' }
  }
  if (senha.length < 6) {
    return { error: 'A senha deve ter ao menos 6 caracteres.' }
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug: use apenas letras minúsculas, números e hifens.' }
  }

  const supabase = createAdminClient()

  // 1. Cria petshop
  const { data: petshop, error: petshopError } = await supabase
    .from('petshops')
    .insert({ nome: nomePetshop, slug })
    .select('id')
    .single()

  if (petshopError) {
    if (petshopError.code === '23505') return { error: 'Este slug já está em uso. Escolha outro.' }
    return { error: 'Erro ao criar petshop. Tente novamente.' }
  }

  // 2. Cria usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  })

  if (authError) {
    await supabase.from('petshops').delete().eq('id', petshop.id)
    if (authError.message.includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado.' }
    }
    return { error: authError.message }
  }

  // 3. Vincula usuário ao petshop
  const { error: usuarioError } = await supabase
    .from('usuarios')
    .insert({
      id: authData.user.id,
      petshop_id: petshop.id,
      nome: nomeDono,
      role: 'admin',
    })

  if (usuarioError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    await supabase.from('petshops').delete().eq('id', petshop.id)
    return { error: 'Erro ao configurar usuário. Tente novamente.' }
  }

  return { success: true }
}
