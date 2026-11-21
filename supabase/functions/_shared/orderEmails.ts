// Plantillas de correo transaccional de pedidos (HTML + texto plano).

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { sendEmail, SendResult } from './email.ts'

export type OrderEmailType =
  | 'order_confirmation'
  | 'status_processing'
  | 'status_shipped'
  | 'status_delivered'
  | 'status_cancelled'

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const money = (n: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n)

export function trackingUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/+$/, '')}/pedido/seguimiento?token=${token}`
}

interface OrderRow {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  shipping_amount: number | null
  tax_amount: number | null
  currency: string
  access_token: string
  shipping_address: any
}

interface ItemRow {
  product_name: string
  variant_name: string | null
  theme_name: string | null
  quantity: number
  total_price: number
}

const COPY: Record<OrderEmailType, { subject: (n: string) => string; title: string; intro: string }> = {
  order_confirmation: {
    subject: (n) => `Recibimos tu pedido ${n}`,
    title: '¡Gracias por tu compra!',
    intro: 'Recibimos tu pedido y tu pago. Estos son los detalles:',
  },
  status_processing: {
    subject: (n) => `Estamos preparando tu pedido ${n}`,
    title: 'Estamos preparando tu pedido',
    intro: 'Tu pedido ya está en producción. Te avisaremos cuando salga.',
  },
  status_shipped: {
    subject: (n) => `Tu pedido ${n} va en camino`,
    title: 'Tu pedido va en camino',
    intro: 'Despachamos tu pedido. Puedes ver su estado en cualquier momento con el enlace de abajo.',
  },
  status_delivered: {
    subject: (n) => `Tu pedido ${n} fue entregado`,
    title: 'Pedido entregado',
    intro: 'Tu pedido fue entregado. ¡Esperamos que lo disfrutes!',
  },
  status_cancelled: {
    subject: (n) => `Tu pedido ${n} fue cancelado`,
    title: 'Pedido cancelado',
    intro: 'Tu pedido fue cancelado. Si tienes dudas, responde a este correo.',
  },
}

export function statusToEmailType(status: string): OrderEmailType | null {
  switch (status) {
    case 'processing': return 'status_processing'
    case 'shipped': return 'status_shipped'
    case 'delivered': return 'status_delivered'
    case 'cancelled': return 'status_cancelled'
    default: return null
  }
}

export function renderOrderEmail(
  type: OrderEmailType,
  order: OrderRow,
  items: ItemRow[],
  siteUrl: string,
  companyName: string,
) {
  const copy = COPY[type]
  const link = trackingUrl(siteUrl, order.access_token)
  const rows = items
    .map((i) => {
      const extra = [i.variant_name, i.theme_name].filter(Boolean).join(' · ')
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.product_name)}${extra ? `<br><span style="color:#777;font-size:12px">${esc(extra)}</span>` : ''}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(i.total_price, order.currency)}</td>
      </tr>`
    })
    .join('')

  const addr = order.shipping_address
  const addrText = addr ? [addr.full_address || addr.street_address, addr.city, addr.state].filter(Boolean).join(', ') : ''

  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#222">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:24px">
    <h2 style="margin:0 0 4px">${esc(copy.title)}</h2>
    <p style="color:#555">Hola ${esc(order.customer_name)}, ${esc(copy.intro)}</p>
    <p><strong>Pedido ${esc(order.order_number)}</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><th align="left">Producto</th><th>Cant.</th><th align="right">Total</th></tr>
      ${rows}
    </table>
    <p style="text-align:right;font-size:14px">
      Envío: ${money(order.shipping_amount || 0, order.currency)}<br>
      Impuestos: ${money(order.tax_amount || 0, order.currency)}<br>
      <strong>Total: ${money(order.total_amount, order.currency)}</strong>
    </p>
    ${addrText ? `<p style="font-size:14px"><strong>Dirección de entrega:</strong><br>${esc(addrText)}</p>` : ''}
    <p style="text-align:center;margin:28px 0">
      <a href="${esc(link)}" style="background:#0f766e;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none">Ver el estado de mi pedido</a>
    </p>
    <p style="color:#999;font-size:12px">Guarda este correo: el botón de arriba te permite consultar tu pedido sin necesidad de cuenta.<br>${esc(companyName)}</p>
  </div></body></html>`

  const text = [
    copy.title,
    `Hola ${order.customer_name}, ${copy.intro}`,
    `Pedido ${order.order_number}`,
    ...items.map((i) => `- ${i.product_name} x${i.quantity}: ${money(i.total_price, order.currency)}`),
    `Total: ${money(order.total_amount, order.currency)}`,
    addrText ? `Dirección de entrega: ${addrText}` : '',
    `Estado de tu pedido: ${link}`,
    companyName,
  ].filter(Boolean).join('\n')

  return { subject: copy.subject(order.order_number), html, text }
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

    const mail = renderOrderEmail(type, order as OrderRow, (items || []) as ItemRow[], siteUrl, company?.setting_value || 'Farfalla Estudio')

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
