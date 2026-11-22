// Plantilla estándar de los correos de la tienda. Sin dependencias: la usan las funciones
// (Deno) para enviar y el panel de administración para la vista previa, así lo que se ve
// es exactamente lo que se envía.

export interface EmailTemplate {
  logoUrl: string
  brandColor: string
  headerText: string // texto bajo el logo si no hay logo (por defecto, el nombre de la tienda)
  footerText: string
  /** Texto de introducción por tipo de correo; vacío = el texto por defecto. */
  intros: Record<string, string>
}

export const TEMPLATE_KEYS = {
  logoUrl: 'email_tpl_logo_url',
  brandColor: 'email_tpl_color',
  headerText: 'email_tpl_header',
  footerText: 'email_tpl_footer',
  intro: (type: string) => `email_tpl_intro_${type}`,
}

export const DEFAULT_BRAND_COLOR = '#0f766e'

export const DEFAULT_TEMPLATE: EmailTemplate = {
  logoUrl: '',
  brandColor: DEFAULT_BRAND_COLOR,
  headerText: '',
  footerText: '',
  intros: {},
}

export const escapeHtml = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const isHexColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim())
export const isHttpsUrl = (v: string) => {
  try {
    const u = new URL(v.trim())
    return u.protocol === 'https:' && !u.username && !u.password && v.length <= 500
  } catch {
    return false
  }
}

/** Convierte las filas de site_settings (clave → valor) en una plantilla válida. */
export function templateFromSettings(cfg: Record<string, string | null | undefined>): EmailTemplate {
  const get = (k: string) => (cfg[k] ?? '').toString().trim()
  const color = get(TEMPLATE_KEYS.brandColor)
  const logo = get(TEMPLATE_KEYS.logoUrl)
  const intros: Record<string, string> = {}
  for (const k of Object.keys(cfg)) {
    const p = 'email_tpl_intro_'
    if (k.startsWith(p) && get(k)) intros[k.slice(p.length)] = get(k).slice(0, 600)
  }
  return {
    logoUrl: isHttpsUrl(logo) ? logo : '',
    brandColor: isHexColor(color) ? color : DEFAULT_BRAND_COLOR,
    headerText: get(TEMPLATE_KEYS.headerText).slice(0, 80),
    footerText: get(TEMPLATE_KEYS.footerText).slice(0, 600),
    intros,
  }
}

export interface EmailShellInput {
  title: string
  /** HTML ya escapado del contenido del mensaje. */
  bodyHtml: string
  companyName: string
  cta?: { label: string; url: string }
  preheader?: string
}

/** Envuelve el contenido de un mensaje en la plantilla estándar (cabecera, cuerpo, pie). */
export function renderEmailShell(tpl: EmailTemplate, m: EmailShellInput): string {
  const color = isHexColor(tpl.brandColor) ? tpl.brandColor : DEFAULT_BRAND_COLOR
  const brand = escapeHtml(tpl.headerText || m.companyName)
  const header = tpl.logoUrl && isHttpsUrl(tpl.logoUrl)
    ? `<img src="${escapeHtml(tpl.logoUrl)}" alt="${brand}" style="max-height:56px;max-width:220px;display:block;margin:0 auto">`
    : `<span style="font-size:22px;font-weight:bold;color:#ffffff;letter-spacing:.5px">${brand}</span>`
  const cta = m.cta
    ? `<p style="text-align:center;margin:28px 0"><a href="${escapeHtml(m.cta.url)}" style="background:${color};color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(m.cta.label)}</a></p>`
    : ''
  const footer = tpl.footerText
    ? escapeHtml(tpl.footerText).replace(/\n/g, '<br>')
    : escapeHtml(m.companyName)
  const pre = m.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(m.preheader)}</div>`
    : ''

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(m.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#222">${pre}
  <div style="max-width:600px;margin:0 auto;padding:16px">
    <div style="background:${tpl.logoUrl ? '#ffffff' : color};border-radius:8px 8px 0 0;padding:20px;text-align:center;${tpl.logoUrl ? `border-bottom:4px solid ${color}` : ''}">${header}</div>
    <div style="background:#ffffff;padding:28px 24px;border-radius:0 0 8px 8px">
      <h2 style="margin:0 0 12px;font-size:20px;color:${color}">${escapeHtml(m.title)}</h2>
      ${m.bodyHtml}
      ${cta}
    </div>
    <p style="text-align:center;color:#888;font-size:12px;line-height:1.5;margin:16px 8px">${footer}</p>
  </div>
</body></html>`
}
