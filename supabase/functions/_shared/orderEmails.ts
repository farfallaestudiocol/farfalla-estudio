// Envío de correos de pedido: carga datos, aplica la plantilla y envía.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { sendEmail, SendResult } from './email.ts'
import { templateFromSettings, EmailTemplate } from './emailTemplate.ts'
import { OrderEmailType, OrderRow, ItemRow, renderOrderEmail, statusToEmailType, trackingUrl } from './orderEmailContent.ts'

export { statusToEmailType, trackingUrl, renderOrderEmail }
export type { OrderEmailType }

/** Lee la plantilla estándar guardada en site_settings (valores inválidos → por defecto). */
export async function loadTemplate(db: SupabaseClient): Promise<EmailTemplate> {
  const { data } = await db.from('site_settings').select('setting_key, setting_value').like('setting_key', 'email_tpl_%')
  const cfg: Record<string, string> = {}
  for (const r of data || []) cfg[r.setting_key] = r.setting_value ?? ''
  return templateFromSettings(cfg)
}

/**
 * Carga la orden y envía el correo correspondiente. No lanza.
 *
 * Idempotencia: cada (pedido, tipo de correo) tiene una clave fija, así que si el envío
 * se reintenta por un corte de red, Fácil Correo no manda un segundo correo. Con
 * `resend: true` (reenvío deliberado del administrador) la clave es nueva.
 */
export async function sendOrderEmail(
  db: SupabaseClient,
  orderId: string,
  type: OrderEmailType,
  siteUrl: string,
  opts: { resend?: boolean } = {},
): Promise<SendResult> {
  try {
    const { data: order, error } = await db
      .from('orders')
      .select('id, order_number, customer_name, customer_email, total_amount, shipping_amount, tax_amount, currency, access_token, shipping_address')
      .eq('id', orderId)
      .single()
    if (error || !order) return { success: false, error: 'Pedido no encontrado' }

    const { data: items } = await db
      .from('order_items')
      .select('product_name, variant_name, theme_name, quantity, total_price')
      .eq('order_id', orderId)

    const { data: company } = await db
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'company_name')
      .maybeSingle()

    const mail = renderOrderEmail(type, order as OrderRow, (items || []) as ItemRow[], siteUrl, company?.setting_value || 'Farfalla Estudio', await loadTemplate(db))

    const idempotencyKey = opts.resend ? `farfalla-${order.id}-${type}-r${Date.now()}` : `farfalla-${order.id}-${type}`

    return await sendEmail(
      db,
      {
        to: order.customer_email,
        toName: order.customer_name,
        ...mail,
        tags: ['pedido', type],
        externalRef: order.order_number,
        metadata: { order_id: order.id, order_number: order.order_number, email_type: type },
      },
      { orderId: order.id, emailType: type, idempotencyKey },
    )
  } catch (err) {
    console.error('sendOrderEmail error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' }
  }
}
