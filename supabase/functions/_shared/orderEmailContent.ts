// Contenido de los correos de pedido (HTML + texto). Sin dependencias de Deno: también lo usa
// el panel de administración para la vista previa de la plantilla.
import { DEFAULT_TEMPLATE, EmailTemplate, escapeHtml, renderEmailShell } from './emailTemplate.ts'

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
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.product_name)}${extra ? `<br><span style="color:#777;font-size:12px">${esc(extra)}</span>` : ''}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(i.total_price, order.currency)}</td>
      </tr>`
    })
    .join('')

  const addr = order.shipping_address
  const addrText = addr ? [addr.full_address || addr.street_address, addr.city, addr.state].filter(Boolean).join(', ') : ''

  const bodyHtml = `
      <p style="color:#555;margin:0 0 16px">Hola ${esc(order.customer_name)}, ${esc(intro)}</p>
      <p style="margin:0 0 8px"><strong>Pedido ${esc(order.order_number)}</strong></p>
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
      <p style="color:#999;font-size:12px;margin:20px 0 0">Guarda este correo: el botón te permite consultar tu pedido sin necesidad de cuenta.</p>`

  const html = renderEmailShell(tpl, {
    title: copy.title,
    bodyHtml,
    companyName,
    cta: { label: 'Ver el estado de mi pedido', url: link },
    preheader: intro,
  })

  const text = [
    copy.title,
    `Hola ${order.customer_name}, ${intro}`,
    `Pedido ${order.order_number}`,
    ...items.map((i) => `- ${i.product_name} x${i.quantity}: ${money(i.total_price, order.currency)}`),
    `Total: ${money(order.total_amount, order.currency)}`,
    addrText ? `Dirección de entrega: ${addrText}` : '',
    `Estado de tu pedido: ${link}`,
    tpl.footerText || companyName,
  ].filter(Boolean).join('\n')

  return { subject: copy.subject(order.order_number), html, text }
}

