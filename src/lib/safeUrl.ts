/**
 * Valida un enlace que viene de la base de datos (banners, redes sociales...) antes de
 * navegar a él. Un enlace "javascript:" ejecutaría código al hacer clic, y una ruta con
 * barra invertida ("/\\sitio.com") se interpreta como otro sitio (redirección abierta).
 *
 * Devuelve el enlace listo para usar, o null si está vacío o no es seguro.
 */
// Caracteres de control (que el navegador ignora dentro de "java\tscript:") y barra invertida
const hasControlOrBackslash = (v: string) => [...v].some((ch) => ch === '\\' || ch.charCodeAt(0) <= 31);

export function safeHref(url: string | null | undefined): string | null {
  const value = (url ?? '').trim();
  if (!value || hasControlOrBackslash(value)) return null;

  // Ruta interna de la propia tienda ("/categoria/navidad"), no "//otro-sitio.com"
  if (value.startsWith('/') && !value.startsWith('//')) return value;

  try {
    const parsed = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}
