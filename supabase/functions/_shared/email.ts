// Cliente de correo para Fácil Correo + registro en email_events.
//
// IMPORTANTE: la función `facilCorreoSend` es el ÚNICO lugar que conoce el
// formato de la API del proveedor. Está escrita con un contrato genérico
// (POST JSON con Bearer) a la espera del manual de Fácil Correo. Cuando se
// tenga la documentación, solo hay que ajustar esa función y `parseWebhook`
// en facilcorreo-webhook; el resto del flujo no cambia.

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

export interface EmailSettings {
  provider: string
  is_enabled: boolean
  api_base_url: string | null
  api_key: string | null
  api_secret: string | null
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
  // Metadatos para que el proveedor los devuelva en el webhook.
  metadata?: Record<string, string>
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

// --- Adaptador del proveedor (AJUSTAR con el manual de Fácil Correo) -----
async function facilCorreoSend(
  s: EmailSettings,
  mail: OutgoingEmail,
): Promise<{ messageId: string | null }> {
  const base = (s.api_base_url || '').replace(/\/+$/, '')
  const res = await fetch(base, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${s.api_key}`,
    },
    body: JSON.stringify({
      from: { email: s.sender_email, name: s.sender_name },
      reply_to: s.reply_to_email || undefined,
      to: [{ email: mail.to, name: mail.toName }],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      track_opens: s.track_opens,
      track_clicks: s.track_clicks,
      metadata: mail.metadata,
      ...(s.extra_config || {}),
    }),
  })

  const bodyText = await res.text()
  if (!res.ok) {
    throw new Error(`Proveedor de correo respondió ${res.status}: ${bodyText.slice(0, 300)}`)
  }

  let json: any = null
  try {
    json = JSON.parse(bodyText)
  } catch {
    // respuesta no-JSON: se acepta, pero sin id de mensaje
  }
  const messageId = json?.message_id ?? json?.messageId ?? json?.id ?? json?.data?.id ?? null
  return { messageId: messageId ? String(messageId) : null }
}
// --------------------------------------------------------------------------

export interface SendResult {
  success: boolean
  error?: string
  eventId?: string
}

/**
 * Envía un correo y deja constancia en email_events. Nunca lanza: devuelve
 * success=false para que un fallo de correo no rompa la creación del pedido.
 */
export async function sendEmail(
  db: SupabaseClient,
  mail: OutgoingEmail,
  opts: { orderId?: string | null; emailType: string; skipLog?: boolean },
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
  if (!settings.api_base_url || !settings.api_key || !settings.sender_email) {
    const eventId = await log({ status: 'failed', error: 'Configuración de correo incompleta' })
    return { success: false, error: 'Configuración de correo incompleta', eventId }
  }

  try {
    const { messageId } = await facilCorreoSend(settings, mail)
    const eventId = await log({
      status: 'sent',
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
