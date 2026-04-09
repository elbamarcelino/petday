'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { enviarFotoWhatsApp } from '@/app/(dashboard)/dashboard/actions'
import type { Agendamento } from '@/types'

interface Props {
  agendamento: Agendamento
  onClose: () => void
  onSuccess: () => void
}

export function FotoWhatsAppModal({ agendamento, onClose, onSuccess }: Props) {
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const petNome = agendamento.pet?.nome ?? 'Pet'
  const tutorNome = agendamento.pet?.cliente?.nome ?? 'Tutor'
  const tutorTelefone = agendamento.pet?.cliente?.telefone ?? '—'
  const servicos = agendamento.agendamento_servicos
    ?.map((as) => as.servico?.nome)
    .filter(Boolean)
    .join(', ') ?? '—'

  const mensagemAuto =
    `Olá, ${tutorNome}! 🐾\n` +
    `O(a) *${petNome}* ficou lindo(a) e está prontinho(a) para ser buscado(a)!\n` +
    `✅ Serviço(s): ${servicos}\n` +
    `Pode vir buscar quando quiser. 😊\n` +
    `— PetDay`

  function aplicarFoto(file: File) {
    if (!file.type.startsWith('image/')) return
    setFoto(file)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) aplicarFoto(file)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) aplicarFoto(file)
  }, [])

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function removerFoto() {
    setFoto(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleEnviar() {
    if (!foto) return
    setSending(true)
    setSendError(null)

    // 1. Upload da foto para o Storage
    const supabase = createClient()
    const ext = foto.name.split('.').pop() ?? 'jpg'
    // Bucket: "fotos-pets" — crie-o no Supabase Storage com policy de autenticados
    const path = `agendamentos/${agendamento.id}/${Date.now()}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('fotos-pets')
      .upload(path, foto, { contentType: foto.type })

    if (storageError) {
      setSendError(`Erro no upload: ${storageError.message}`)
      setSending(false)
      return
    }

    // 2. Gerar URL assinada, marcar como concluído e enviar pelo WhatsApp
    const result = await enviarFotoWhatsApp(
      agendamento.id,
      path,
      tutorTelefone,
      mensagemAuto,
    )

    if (result?.error) {
      setSendError(result.error)
      setSending(false)
      return
    }

    onSuccess()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--color-card)] rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">

          {/* Cabeçalho */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                Enviar foto pelo WhatsApp
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-medium text-[var(--color-foreground)]">{petNome}</span>
                {' '}—{' '}
                {tutorNome}
                {' · '}
                <span className="font-mono">{tutorTelefone}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>

          {/* Área de upload */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Foto do pet *
            </label>

            {!preview ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                className={`
                  relative flex flex-col items-center justify-center gap-3
                  border-2 border-dashed rounded-2xl p-10 cursor-pointer
                  transition-colors select-none
                  ${dragging
                    ? 'border-[var(--color-primary)] bg-[var(--color-muted)]'
                    : 'border-gray-300 hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]'
                  }
                `}
              >
                <span className="text-5xl">📷</span>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Clique ou arraste uma foto aqui
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG ou WEBP — máx. 5 MB
                  </p>
                </div>
                {dragging && (
                  <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/10 pointer-events-none" />
                )}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview da foto do pet"
                  className="w-full max-h-72 object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-xs truncate">{foto?.name}</span>
                  <button
                    type="button"
                    onClick={removerFoto}
                    className="text-white/80 hover:text-white text-xs underline flex-shrink-0 ml-3"
                  >
                    Trocar foto
                  </button>
                </div>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>

          {/* Preview da mensagem */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Mensagem que será enviada
            </label>
            <div className="bg-[#e9fbe5] border border-[#c3f0b2] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <span className="text-xs font-semibold text-green-800">WhatsApp</span>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                {mensagemAuto}
              </p>
            </div>
          </div>

          {/* Rodapé */}
          <div className="space-y-3 pt-1">
            {!foto && !sending && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-[var(--radius)]">
                Selecione uma foto para habilitar o envio.
              </p>
            )}
            {sendError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-[var(--radius)]">
                {sendError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="flex-1 py-2.5 border rounded-[var(--radius)] text-sm font-medium hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviar}
                disabled={!foto || sending}
                className="flex-1 py-2.5 bg-[#25d366] text-white rounded-[var(--radius)] text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span>📲</span>
                    Enviar pelo WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
