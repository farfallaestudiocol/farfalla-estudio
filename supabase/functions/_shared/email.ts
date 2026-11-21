// Cliente de correo para Fácil Correo (API HTTP) + registro en email_events.
//
// Referencia: "Manual de integración de correo — Fácil Correo".
//   POST {base}/v1/messages   Authorization: Bearer <clave>   Idempotency-Key: <único por correo>
//   202 Accepted → { messages: [{ id, to, status: "Accepted" }] }  (en cola, NO entregado)
// El estado real (sent, delivered, bounced, opened...) llega después por webhook:
// ver facilcorreo-webhook.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

/** Dirección de la API que entrega Fácil Correo al dar de alta la cuenta. */
export const DEFAULT_API_BASE_URL = 'https://app.facil-apps.com.co'

export interface EmailSettings {
  provider: string
  is_enabled: boolean
  api_base_url: string | null
  api_key: string | null
  webhook_secret: string | null
  sender_name: string | null
  sender_email: string | null
  reply_to_email: string | null
  track_opens: boolean
  track_clicks: boolean
  extra_config: Record<string, unknown>
}

export interface OutgoingEmail {
  to: string
  toName?: string
  subject: string
  html: string
  text: string
  // Hasta 20 pares (clave ≤ 64, valor ≤ 500). Vuelven en los webhooks.
  metadata?: Record<string, string>
  tags?: string[]
  // Nuestro identificador (p. ej. número de pedido); permite buscar el mensaje en Fácil Correo.
  externalRef?: string
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}

export async function loadEmailSettings(db: SupabaseClient): Promise<EmailSettings | null> {
  const { data, error } = await db.from('email_settings').select('*').eq('id', 1).maybeSingle()
  if (error) {
    console.error('Error loading email_settings:', error)
    return null
  }
  return data as EmailSettings | null
}

/** Error de la API con un mensaje listo para mostrar al administrador. */
export class ProviderError extends Error {
  constructor(message: string, public status: number, public code?: string, public retryable = false) {
    super(message)
  }
}

/** Traduce las respuestas de error del manual (sección 8) a mensajes claros. */
export function describeProviderError(status: number, body: any): ProviderError {
  const code: string | undefined = body?.error?.code
  const detail: string | undefined = body?.error?.message
  const fields = body?.error?.fields ? ` (${JSON.stringify(body.error.fields).slice(0, 200)})` : ''

  if (status === 401) {
    return new ProviderError('Fácil Correo rechazó la clave de API: es inválida, fue revocada, venció o la IP no está permitida.', status, code)
  }
  if (status === 403 && code === 'domain_not_verified') {
    return new ProviderError('El dominio del remitente no está verificado en Fácil Correo. Termine la verificación de los registros DNS.', status, code)
  }
  if (status === 403 && code === 'sender_not_allowed') {
    return new ProviderError('La clave o el dominio no permiten usar ese correo como remitente.', status, code)
  }
  if (status === 403) {
    return new ProviderError(`Fácil Correo denegó el envío${detail ? `: ${detail}` : ''}.`, status, code)
  }
  if (status === 422) {
    return new ProviderError(`Fácil Correo rechazó los datos del correo${detail ? `: ${detail}` : ''}${fields}.`, status, code)
  }
  if (status === 429) {
    return new ProviderError('Se alcanzó el cupo del plan de Fácil Correo. Reintente más tarde o pida ampliarlo.', status, code)
  }
  if (status >= 500) {
    return new ProviderError(`Fácil Correo no está disponible por ahora (HTTP ${status}).`, status, code, true)
  }
  return new ProviderError(`Fácil Correo respondió HTTP ${status}${detail ? `: ${detail}` : ''}.`, status, code)
}

const RETRY_DELAYS_MS = [500, 1500]

/**
 * Envía un correo. Ante fallos temporales (red o 5xx) reintenta con espera creciente
 * y la MISMA Idempotency-Key, así un reintento nunca duplica el correo.
 */
export async function facilCorreoSend(
  s: EmailSettings,
  mail: OutgoingEmail,
  idempotencyKey: string,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<{ messageId: string | null }> {
  const base = (s.api_base_url || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  const payload = {
    from: { email: s.sender_email, ...(s.sender_name ? { name: s.sender_name } : {}) },
    to: [{ email: mail.to, ...(mail.toName ? { name: mail.toName } : {}) }],
    subject: mail.subject.replace(/[\r\n]+/g, ' ').slice(0, 998),
    html: mail.html,
    text: mail.text,
    ...(s.reply_to_email ? { reply_to: s.reply_to_email } : {}),
    ...(mail.tags?.length ? { tags: mail.tags.slice(0, 10) } : {}),
    ...(mail.metadata ? { metadata: mail.metadata } : {}),
    ...(mail.externalRef ? { external_ref: mail.externalRef } : {}),
    track_opens: s.track_opens,
    track_clicks: s.track_clicks,
  }

  let lastError: ProviderError | null = null
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])

    let res: Response
    try {
      res = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${s.api_key}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      lastError = new ProviderError(
        `No se pudo conectar con Fácil Correo: ${err instanceof Error ? err.message : 'error de red'}.`,
        0, undefined, true,
      )
      continue
    }

    const text = await res.text()
    let body: any = null
    try { body = JSON.parse(text) } catch { /* cuerpo no-JSON */ }

    if (res.status === 202 || res.status === 200) {
      const id = body?.messages?.[0]?.id
      return { messageId: id ? String(id) : null }
    }

    const err = describeProviderError(res.status, body)
    if (!err.retryable) throw err
    lastError = err
  }
  throw lastError ?? new ProviderError('No se pudo enviar el correo.', 0)
}

export interface SendResult {
  success: boolean
  error?: string
  eventId?: string
}

/**
 * Envía un correo y deja constancia en email_events. Nunca lanza: devuelve
 * success=false para que un fallo de correo no rompa la creación del pedido.
 *
 * `idempotencyKey`: único por correo lógico. Con la misma clave, un reintento no envía
 * otro correo. Para un reenvío deliberado hay que pasar una clave distinta.
 */
export async function sendEmail(
  db: SupabaseClient,
  mail: OutgoingEmail,
  opts: { orderId?: string | null; emailType: string; idempotencyKey: string; skipLog?: boolean },
): Promise<SendResult> {
  const settings = await loadEmailSettings(db)

  const log = async (fields: Record<string, unknown>) => {
    if (opts.skipLog) return undefined
    const { data, error } = await db
      .from('email_events')
      .insert({
        order_id: opts.orderId ?? null,
        email_type: opts.emailType,
        recipient: mail.to,
        subject: mail.subject,
        provider: settings?.provider ?? 'facilcorreo',
        ...fields,
      })
      .select('id')
      .single()
    if (error) console.error('Error writing email_events:', error)
    return data?.id as string | undefined
  }

  if (!settings || !settings.is_enabled) {
    const eventId = await log({ status: 'failed', error: 'Envío de correos desactivado en la configuración' })
    return { success: false, error: 'Envío de correos desactivado', eventId }
  }
  if (!settings.api_key || !settings.sender_email) {
    const eventId = await log({ status: 'failed', error: 'Configuración de correo incompleta (falta la clave de API o el remitente)' })
    return { success: false, error: 'Configuración de correo incompleta', eventId }
  }

  try {
    const { messageId } = await facilCorreoSend(settings, mail, opts.idempotencyKey)
    // 202 = aceptado y en cola, no entregado. El webhook lo lleva a sent/delivered/...
    const eventId = await log({
      status: 'queued',
      provider_message_id: messageId,
      sent_at: new Date().toISOString(),
    })
    return { success: true, eventId }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error sending email:', message)
    const eventId = await log({ status: 'failed', error: message.slice(0, 500) })
    return { success: false, error: message, eventId }
  }
}
