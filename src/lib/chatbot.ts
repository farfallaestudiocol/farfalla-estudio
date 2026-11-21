// Chatbot web de Fácil Correo (manual, sección 12). Se instala pegando un <script> con el
// identificador público del chatbot (data-bot). No requiere credenciales de WhatsApp ni de
// ningún otro canal: eso es un complemento aparte.
//
//   <script src="https://app.facil-apps.com.co/widget.js" data-bot="bt_xxxxxxxx" data-color="#1f5fd1" async></script>

export const DEFAULT_WIDGET_SCRIPT_URL = 'https://app.facil-apps.com.co/widget.js';

export const DEFAULT_BOT_NAME = 'Asistente virtual';

/**
 * Dos formas de mostrar el chatbot:
 * - "launcher": el botón flotante de la tienda ofrece el asistente y WhatsApp en un mismo menú, y el
 *   asistente se abre con el enlace «Abrir el chat» del panel de Fácil Correo. No carga el script del widget.
 * - "script": se carga el widget de Fácil Correo, que pone su propio botón flotante.
 */
export type ChatbotMode = 'launcher' | 'script';

export interface ChatbotConfig {
  mode: ChatbotMode;
  name: string; // cómo se llama el asistente de cara al cliente
  botId: string; // '' en modo launcher
  color: string; // '' si no se definió
  scriptUrl: string; // '' en modo launcher
  chatUrl: string; // '' en modo script
}

// Lo que se guarda en site_settings (público: el identificador del chatbot lo es por diseño).
export interface ChatbotSettings {
  chatbot_enabled: boolean;
  chatbot_bot_id: string;
  chatbot_color: string;
  chatbot_script_url: string;
  chatbot_name: string;
  chatbot_chat_url: string;
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

/**
 * El enlace «Abrir el chat» se abre en una ventana aparte: solo se acepta https, sin usuario
 * ni contraseña en la dirección.
 */
export function isValidChatUrl(v: string): boolean {
  if (v.length > 500) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** Nombre visible del asistente: sin espacios de sobra, sin caracteres de control y hasta 40 letras. */
export function cleanBotName(v: string | undefined | null): string {
  const name = [...(v ?? '')]
    .filter((ch) => ch.charCodeAt(0) > 31)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
  return name || DEFAULT_BOT_NAME;
}

/** Devuelve la configuración lista para usar, o null si el chatbot no debe mostrarse. */
export function resolveChatbotConfig(s: Partial<ChatbotSettings> | null | undefined): ChatbotConfig | null {
  if (!s || !s.chatbot_enabled) return null;
  const name = cleanBotName(s.chatbot_name);
  const rawColor = (s.chatbot_color || '').trim();
  const color = isValidColor(rawColor) ? rawColor : '';

  // Con enlace de chat válido, el asistente va dentro del botón flotante de la tienda
  const chatUrl = (s.chatbot_chat_url || '').trim();
  if (chatUrl && isValidChatUrl(chatUrl)) {
    return { mode: 'launcher', name, botId: '', color, scriptUrl: '', chatUrl };
  }

  // Si no, se usa el widget de Fácil Correo con su propio botón
  const botId = (s.chatbot_bot_id || '').trim();
  if (!isValidBotId(botId)) return null;

  const rawUrl = (s.chatbot_script_url || '').trim();
  const scriptUrl = rawUrl || DEFAULT_WIDGET_SCRIPT_URL;
  if (!isValidScriptUrl(scriptUrl)) return null;

  return { mode: 'script', name, botId, color, scriptUrl, chatUrl: '' };
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
