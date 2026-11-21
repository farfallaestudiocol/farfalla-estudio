// Chatbot web de Fácil Correo (manual, sección 12). Se instala pegando un <script> con el
// identificador público del chatbot (data-bot). No requiere credenciales de WhatsApp ni de
// ningún otro canal: eso es un complemento aparte.
//
//   <script src="https://app.facil-apps.com.co/widget.js" data-bot="bt_xxxxxxxx" data-color="#1f5fd1" async></script>

export const DEFAULT_WIDGET_SCRIPT_URL = 'https://app.facil-apps.com.co/widget.js';

export interface ChatbotConfig {
  botId: string;
  color: string; // '' si no se definió
  scriptUrl: string;
}

// Lo que se guarda en site_settings (público: el identificador del chatbot lo es por diseño).
export interface ChatbotSettings {
  chatbot_enabled: boolean;
  chatbot_bot_id: string;
  chatbot_color: string;
  chatbot_script_url: string;
}

const BOT_ID_RE = /^[A-Za-z0-9_-]{3,64}$/;
const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const isValidBotId = (v: string) => BOT_ID_RE.test(v);
export const isValidColor = (v: string) => COLOR_RE.test(v);

/**
 * El script se carga con privilegios totales en la tienda, así que solo se acepta una
 * dirección https que termine en /widget.js (sin credenciales ni parámetros).
 */
export function isValidScriptUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname.endsWith('/widget.js');
  } catch {
    return false;
  }
}

/** Devuelve la configuración lista para cargar, o null si el chatbot no debe mostrarse. */
export function resolveChatbotConfig(s: Partial<ChatbotSettings> | null | undefined): ChatbotConfig | null {
  if (!s || !s.chatbot_enabled) return null;
  const botId = (s.chatbot_bot_id || '').trim();
  if (!isValidBotId(botId)) return null;

  const rawUrl = (s.chatbot_script_url || '').trim();
  const scriptUrl = rawUrl || DEFAULT_WIDGET_SCRIPT_URL;
  if (!isValidScriptUrl(scriptUrl)) return null;

  const rawColor = (s.chatbot_color || '').trim();
  return { botId, color: isValidColor(rawColor) ? rawColor : '', scriptUrl };
}

export interface ParsedInstall {
  botId: string;
  color: string;
  scriptUrl: string;
}

/**
 * Acepta el código de instalación completo que muestra el panel, o solo el identificador,
 * y extrae sus partes. Devuelve null si no se reconoce un identificador válido.
 */
export function parseInstallInput(input: string): ParsedInstall | null {
  const text = (input || '').trim();
  if (!text) return null;

  if (/<\s*script/i.test(text)) {
    const attr = (name: string) => {
      const m = text.match(new RegExp(`${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
      return (m?.[1] ?? m?.[2] ?? '').trim();
    };
    const botId = attr('data-bot');
    if (!isValidBotId(botId)) return null;
    const color = attr('data-color');
    const src = attr('src');
    return {
      botId,
      color: isValidColor(color) ? color : '',
      scriptUrl: src && isValidScriptUrl(src) ? src : '',
    };
  }

  return isValidBotId(text) ? { botId: text, color: '', scriptUrl: '' } : null;
}
