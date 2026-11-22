// Plantilla estándar de los correos de la tienda. Sin dependencias: la usan las funciones
// (Deno) para enviar y el panel de administración para la vista previa, así lo que se ve
// es exactamente lo que se envía.

export interface EmailTemplate {
  logoUrl: string
  brandColor: string
  accentColor: string
  headerText: string // texto bajo el logo si no hay logo (por defecto, el nombre de la tienda)
  footerText: string
  /** Texto de introducción por tipo de correo; vacío = el texto por defecto. */
  intros: Record<string, string>
}

export const TEMPLATE_KEYS = {
  logoUrl: 'email_tpl_logo_url',
  brandColor: 'email_tpl_color',
  accentColor: 'email_tpl_accent',
  headerText: 'email_tpl_header',
  footerText: 'email_tpl_footer',
  intro: (type: string) => `email_tpl_intro_${type}`,
}

/** Verde azulado de la marca, oscurecido para que el texto blanco del botón se lea bien. */
export const DEFAULT_BRAND_COLOR = '#2f8f89'
export const DEFAULT_ACCENT_COLOR = '#F4B0B9'

/** Claves de site_settings que alimentan la plantilla (incluye los logos de la marca). */
export const LOGO_FALLBACK_KEYS = ['logo_rectangular_color_url', 'logo_color_url', 'company_logo_url']

export const DEFAULT_TEMPLATE: EmailTemplate = {
  logoUrl: '',
  brandColor: DEFAULT_BRAND_COLOR,
  accentColor: DEFAULT_ACCENT_COLOR,
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
  const accent = get(TEMPLATE_KEYS.accentColor)
  // Logo: el de la plantilla; si no hay, el logo horizontal de la marca (Branding)
  const logo = [get(TEMPLATE_KEYS.logoUrl), ...LOGO_FALLBACK_KEYS.map(get)].find((u) => u && isHttpsUrl(u)) || ''
  const intros: Record<string, string> = {}
  for (const k of Object.keys(cfg)) {
    const p = 'email_tpl_intro_'
    if (k.startsWith(p) && get(k)) intros[k.slice(p.length)] = get(k).slice(0, 600)
  }
  return {
    logoUrl: logo,
    brandColor: isHexColor(color) ? color : DEFAULT_BRAND_COLOR,
    accentColor: isHexColor(accent) ? accent : DEFAULT_ACCENT_COLOR,
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

/** Envuelve el contenido de un mensaje en la plantilla estándar (tarjeta con marca, cuerpo y pie). */
export function renderEmailShell(tpl: EmailTemplate, m: EmailShellInput): string {
  const color = isHexColor(tpl.brandColor) ? tpl.brandColor : DEFAULT_BRAND_COLOR
  const accent = isHexColor(tpl.accentColor) ? tpl.accentColor : DEFAULT_ACCENT_COLOR
  const brand = escapeHtml(tpl.headerText || m.companyName)
  const font = "'Helvetica Neue',Helvetica,Arial,sans-serif"
  const logo = tpl.logoUrl && isHttpsUrl(tpl.logoUrl)
    ? `<img src="${escapeHtml(tpl.logoUrl)}" alt="${brand}" height="56" style="height:56px;max-width:240px;width:auto;display:inline-block;border:0">`
    : `<span style="font-size:26px;font-weight:bold;color:${color};letter-spacing:.5px;font-family:Georgia,'Times New Roman',serif">${brand}</span>`
  const cta = m.cta
    ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:30px auto 6px"><tr><td style="background:${color};border-radius:999px"><a href="${escapeHtml(m.cta.url)}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:bold;font-size:15px;text-decoration:none;font-family:${font}">${escapeHtml(m.cta.label)}</a></td></tr></table>`
    : ''
  const footer = tpl.footerText
    ? escapeHtml(tpl.footerText).replace(/\n/g, '<br>')
    : escapeHtml(m.companyName)
  const pre = m.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f3faf9">${escapeHtml(m.preheader)}</div>`
    : ''

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(m.title)}</title></head>
<body style="margin:0;padding:0;background:#eef8f7;font-family:${font};color:#333333">${pre}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eef8f7" style="background:#eef8f7;background-image:linear-gradient(135deg,#e6f6f4 0%,#fdeef0 100%)"><tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
    <tr><td style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(47,143,137,.12)">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="70%" height="6" style="height:6px;line-height:6px;font-size:0;background:${color}">&nbsp;</td>
          <td width="30%" height="6" style="height:6px;line-height:6px;font-size:0;background:${accent}">&nbsp;</td>
        </tr>
        <tr><td colspan="2" align="center" style="padding:30px 24px 10px">${logo}</td></tr>
        <tr><td colspan="2" style="padding:6px 32px 34px">
          <h1 style="margin:14px 0 16px;font-size:24px;line-height:1.3;text-align:center;color:#333333;font-family:Georgia,'Times New Roman',serif">${escapeHtml(m.title)}</h1>
          <div style="font-size:15px;line-height:1.6;color:#444444">
            ${m.bodyHtml}
          </div>
          ${cta}
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding:20px 16px 4px;font-size:12px;line-height:1.6;color:#777777">${footer}</td></tr>
  </table>
</td></tr></table>
</body></html>`
}
