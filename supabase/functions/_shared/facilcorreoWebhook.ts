// Lógica de los webhooks de Fácil Correo (manual, sección 7).
//
// Entrega: POST con cabeceras FacilCorreo-Signature, -Delivery-Id, -Event-Type, -Attempt.
// Firma: "t=<unix>,v1=<hex>"; v1 = HMAC-SHA256("{t}.{cuerpo crudo}", secreto).
// Hay que validar con el cuerpo SIN re-serializar y rechazar marcas con más de ~5 min.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

export const SIGNATURE_TOLERANCE_SEC = 300

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')

/** Comparación en tiempo constante de dos cadenas hexadecimales. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifySignature(
  secret: string,
  header: string | null,
  rawBody: string,
  nowSec = Math.floor(Date.now() / 1000),
  toleranceSec = SIGNATURE_TOLERANCE_SEC,
): Promise<boolean> {
  if (!header) return false
  const parts: Record<string, string> = {}
  for (const piece of header.split(',')) {
    const i = piece.indexOf('=')
    if (i > 0) parts[piece.slice(0, i).trim()] = piece.slice(i + 1).trim()
  }
  const t = Number(parts.t)
  if (!parts.t || !parts.v1 || !Number.isFinite(t)) return false
  if (Math.abs(nowSec - t) > toleranceSec) return false

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${rawBody}`)))
  return timingSafeEqual(expected, parts.v1.toLowerCase())
}

/** Estado en email_events que corresponde a cada evento del proveedor. */
export const EVENT_STATUS: Record<string, string | null> = {
  'message.sent': 'sent',
  'message.delivered': 'delivered',
  'message.deferred': 'deferred',
  'message.bounced': 'bounced',
  'message.complained': 'complained',
  'message.opened': 'opened',
  'message.clicked': 'clicked',
  'message.failed': 'failed',
  'message.suppressed': 'suppressed',
  'message.unsubscribed': null, // no cambia el estado de entrega
}

// Un evento atrasado no debe "retroceder" el estado (p. ej. un "sent" tardío tras "opened").
// Los finales negativos (rebote, queja, fallo, suprimido) pesan más que cualquier avance.
const RANK: Record<string, number> = {
  queued: 0, sent: 1, deferred: 1, delivered: 2, opened: 3, clicked: 4,
  failed: 9, bounced: 9, complained: 9, suppressed: 9,
}

export interface ProviderEvent {
  id: string
  type: string
  created_at?: string
  livemode?: boolean
  data?: { message?: { id?: string; to?: string; external_ref?: string }; details?: unknown }
}

export type ApplyResult = 'applied' | 'duplicate' | 'unknown_message' | 'ignored'

/**
 * Aplica un evento a email_events. Es idempotente: un reintento del proveedor (mismo id
 * "evt_…") no suma aperturas dos veces. Un evento de un mensaje que no es nuestro (p. ej.
 * la prueba POST /v1/webhooks/{id}/test) se ignora sin error, para responder 2xx igual.
 */
export async function applyEvent(db: SupabaseClient, evt: ProviderEvent): Promise<ApplyResult> {
  const messageId = evt.data?.message?.id
  if (!evt.id || !evt.type || !messageId) return 'ignored'
  if (!(evt.type in EVENT_STATUS)) return 'ignored'

  const { data: row } = await db
    .from('email_events')
    .select('id, status, open_count, click_count, first_opened_at, raw_events')
    .eq('provider_message_id', messageId)
    .maybeSingle()
  if (!row) return 'unknown_message'

  const history = (Array.isArray(row.raw_events) ? row.raw_events : []) as ProviderEvent[]
  if (history.some((e) => e?.id === evt.id)) return 'duplicate'

  const at = evt.created_at ? new Date(evt.created_at).toISOString() : new Date().toISOString()
  const update: Record<string, unknown> = { raw_events: [...history.slice(-49), evt] }

  switch (evt.type) {
    case 'message.delivered':
      update.delivered_at = at
      break
    case 'message.opened':
      update.open_count = (row.open_count || 0) + 1
      update.last_opened_at = at
      if (!row.first_opened_at) update.first_opened_at = at
      break
    case 'message.clicked':
      update.click_count = (row.click_count || 0) + 1
      update.last_clicked_at = at
      break
    case 'message.bounced':
    case 'message.complained':
    case 'message.failed':
    case 'message.suppressed': {
      const details = evt.data?.details
      update.error = (typeof details === 'string' ? details : JSON.stringify(details ?? {})).slice(0, 500)
      break
    }
  }

  const next = EVENT_STATUS[evt.type]
  const current = (row.status as string) || 'queued'
  if (next && (RANK[next] ?? 0) >= (RANK[current] ?? 0)) update.status = next

  await db.from('email_events').update(update).eq('id', row.id)
  return 'applied'
}
