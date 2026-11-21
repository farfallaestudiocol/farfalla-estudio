// Recibe eventos de Fácil Correo (entrega, apertura, clic, rebote) y actualiza email_events.
//
// AJUSTAR con el manual del proveedor: la verificación de firma (`verifySignature`)
// y el mapeo de campos (`parseWebhook`) asumen un formato genérico.
import { corsHeaders, json } from '../_shared/http.ts'
import { getServiceClient, loadEmailSettings } from '../_shared/email.ts'

interface ParsedEvent {
  messageId: string
  type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unknown'
  at: string
  raw: unknown
}

function parseWebhook(payload: any): ParsedEvent[] {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : [payload]
  return list.map((e: any) => {
    const rawType = String(e?.event ?? e?.type ?? '').toLowerCase()
    let type: ParsedEvent['type'] = 'unknown'
    if (/deliver/.test(rawType)) type = 'delivered'
    else if (/open/.test(rawType)) type = 'opened'
    else if (/click/.test(rawType)) type = 'clicked'
    else if (/bounce/.test(rawType)) type = 'bounced'
    else if (/fail|reject|drop/.test(rawType)) type = 'failed'
    return {
      messageId: String(e?.message_id ?? e?.messageId ?? e?.id ?? ''),
      type,
      at: e?.timestamp ? new Date(e.timestamp).toISOString() : new Date().toISOString(),
      raw: e,
    }
  })
}

async function verifySignature(secret: string, rawBody: string, provided: string | null) {
  if (!provided) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const clean = provided.replace(/^sha256=/i, '').toLowerCase()
  if (clean.length !== hex.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ clean.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const db = getServiceClient()
  const rawBody = await req.text()

  const settings = await loadEmailSettings(db)
  // Sin secreto configurado se rechaza: el endpoint es público y no debe aceptar eventos sin firma.
  if (!settings?.webhook_secret) return json({ error: 'Webhook no configurado' }, 503)

  const provided = req.headers.get('x-signature') ?? req.headers.get('x-facilcorreo-signature')
  if (!(await verifySignature(settings.webhook_secret, rawBody, provided))) {
    return json({ error: 'Firma inválida' }, 401)
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }

  for (const ev of parseWebhook(payload)) {
    if (!ev.messageId || ev.type === 'unknown') continue

    const { data: row } = await db
      .from('email_events')
      .select('id, status, open_count, click_count, first_opened_at, raw_events')
      .eq('provider_message_id', ev.messageId)
      .maybeSingle()
    if (!row) continue

    const update: Record<string, unknown> = {
      raw_events: [...((row.raw_events as unknown[]) || []).slice(-49), ev.raw],
    }
    switch (ev.type) {
      case 'delivered':
        update.delivered_at = ev.at
        if (row.status === 'sent') update.status = 'delivered'
        break
      case 'opened':
        update.open_count = (row.open_count || 0) + 1
        update.last_opened_at = ev.at
        if (!row.first_opened_at) update.first_opened_at = ev.at
        if (row.status !== 'clicked') update.status = 'opened'
        break
      case 'clicked':
        update.click_count = (row.click_count || 0) + 1
        update.last_clicked_at = ev.at
        update.status = 'clicked'
        break
      case 'bounced':
        update.status = 'bounced'
        break
      case 'failed':
        update.status = 'failed'
        break
    }
    await db.from('email_events').update(update).eq('id', row.id)
  }

  return json({ success: true })
})
