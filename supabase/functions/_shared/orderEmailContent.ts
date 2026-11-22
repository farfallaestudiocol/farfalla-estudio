// Contenido de los correos de pedido (HTML + texto). Sin dependencias de Deno: también lo usa
// el panel de administración para la vista previa de la plantilla.
import { DEFAULT_BRAND_COLOR, DEFAULT_TEMPLATE, EmailTemplate, escapeHtml, isHexColor, renderEmailShell } from './emailTemplate.ts'

export type OrderEmailType =
  | 'order_confirmation'
  | 'status_processing'
  | 'status_shipped'
  | 'status_delivered'
  | 'status_cancelled'

const esc = escapeHtml

const money = (n: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n)

export function trackingUrl(siteUrl: string, token: string) {
  return `${siteUrl.replace(/\/+$/, '')}/pedido/seguimiento?token=${token}`
}

export interface OrderRow {
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

export interface ItemRow {
  product_name: string
  variant_name: string | null
  theme_name: string | null
  quantity: number
  total_price: number
}

export const COPY: Record<OrderEmailType, { subject: (n: string) => string; title: string; intro: string }> = {
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
  tpl: EmailTemplate = DEFAULT_TEMPLATE,
) {
  const copy = COPY[type]
  const intro = tpl.intros[type] || copy.intro
  const link = trackingUrl(siteUrl, order.access_token)
  const rows = items
    .map((i) => {
      const extra = [i.variant_name, i.theme_name].filter(Boolean).join(' · ')
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e3eeed;font-size:14px">${esc(i.product_name)}${extra ? `<br><span style="color:#888;font-size:12px">${esc(extra)}</span>` : ''}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e3eeed;text-align:center;font-size:14px;color:#666">×${i.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #e3eeed;text-align:right;font-size:14px;white-space:nowrap">${money(i.total_price, order.currency)}</td>
      </tr>`
    })
    .join('')

  const addr = order.shipping_address
  const addrText = addr ? [addr.full_address || addr.street_address, addr.city, addr.state].filter(Boolean).join(', ') : ''
  const accent = isHexColor(tpl.brandColor) ? tpl.brandColor : DEFAULT_BRAND_COLOR

  const bodyHtml = `
      <p style="margin:0 0 4px;text-align:center;color:#333;font-size:16px">Hola <strong>${esc(order.customer_name)}</strong>,</p>
      <p style="margin:0 0 22px;text-align:center;color:#555">${esc(intro)}</p>
      <div style="background:#f5fbfa;border:1px solid #dcefed;border-radius:12px;padding:18px 20px">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${accent};font-weight:bold">Pedido ${esc(order.order_number)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
          <tr><td colspan="2" style="padding:10px 0 2px;font-size:13px;color:#777">Envío</td><td style="padding:10px 0 2px;text-align:right;font-size:13px;color:#777">${money(order.shipping_amount || 0, order.currency)}</td></tr>
          <tr><td colspan="2" style="padding:2px 0;font-size:13px;color:#777">Impuestos</td><td style="padding:2px 0;text-align:right;font-size:13px;color:#777">${money(order.tax_amount || 0, order.currency)}</td></tr>
          <tr><td colspan="2" style="padding:10px 0 0;font-size:16px;font-weight:bold">Total</td><td style="padding:10px 0 0;text-align:right;font-size:16px;font-weight:bold;color:${accent}">${money(order.total_amount, order.currency)}</td></tr>
        </table>
      </div>
      ${addrText ? `<p style="margin:18px 0 0;font-size:14px;color:#555"><strong>Dirección de entrega</strong><br>${esc(addrText)}</p>` : ''}
      <p style="margin:22px 0 0;text-align:center;color:#999;font-size:12px">Guarda este correo: el botón te permite consultar tu pedido sin necesidad de cuenta.</p>`

  const html = renderEmailShell(tpl, {
    title: copy.title,
    bodyHtml,
    companyName,
    cta: { label: 'Ver el estado de mi pedido', url: link },
    preheader: intro,
  })

  const text = [
    copy.title,
    `Hola ${order.customer_name},\n${intro}`,
    `Pedido ${order.order_number}`,
    ...items.map((i) => `- ${i.product_name} x${i.quantity}: ${money(i.total_price, order.currency)}`),
    `Total: ${money(order.total_amount, order.currency)}`,
    addrText ? `Dirección de entrega: ${addrText}` : '',
    `Estado de tu pedido: ${link}`,
    tpl.footerText || companyName,
  ].filter(Boolean).join('\n')

  return { subject: copy.subject(order.order_number), html, text }
}

