// Evolution API — https://doc.evolution-api.com

function formatarTelefone(telefone: string): string | null {
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return null
}

function credenciais(): { url: string; apiKey: string; instancia: string } | null {
  const url = process.env.EVOLUTION_API_URL?.replace(/\/$/, '')
  const apiKey = process.env.EVOLUTION_API_KEY
  const instancia = process.env.EVOLUTION_INSTANCE_NAME
  if (!url || !apiKey || !instancia) return null
  return { url, apiKey, instancia }
}

export async function enviarTextoWhatsApp(
  telefone: string,
  mensagem: string,
): Promise<{ ok: boolean; erro?: string }> {
  const creds = credenciais()
  if (!creds) return { ok: false, erro: 'Evolution API não configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME).' }

  const numero = formatarTelefone(telefone)
  if (!numero) return { ok: false, erro: `Telefone inválido: "${telefone}"` }

  try {
    const res = await fetch(`${creds.url}/message/sendText/${creds.instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: creds.apiKey },
      body: JSON.stringify({ number: numero, text: mensagem }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, erro: `Evolution API ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, erro: `Falha de rede: ${err instanceof Error ? err.message : String(err)}` }
  }
}

export async function enviarImagemWhatsApp(
  telefone: string,
  imagemUrl: string,
  legenda: string,
  fileName = 'foto.jpg',
): Promise<{ ok: boolean; erro?: string }> {
  const creds = credenciais()
  if (!creds) return { ok: false, erro: 'Evolution API não configurada (EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME).' }

  const numero = formatarTelefone(telefone)
  if (!numero) return { ok: false, erro: `Telefone inválido: "${telefone}"` }

  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const mimetype = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

  try {
    const res = await fetch(`${creds.url}/message/sendMedia/${creds.instancia}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: creds.apiKey },
      body: JSON.stringify({
        number: numero,
        mediatype: 'image',
        mimetype,
        caption: legenda,
        media: imagemUrl,
        fileName,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      return { ok: false, erro: `Evolution API ${res.status}: ${body}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, erro: `Falha de rede: ${err instanceof Error ? err.message : String(err)}` }
  }
}
