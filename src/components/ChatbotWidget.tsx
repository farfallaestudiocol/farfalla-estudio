import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveChatbotConfig } from '@/lib/chatbot';

const SCRIPT_MARK = 'data-farfalla-chatbot';

/**
 * Carga el widget del chatbot web (Fácil Correo) en la tienda cuando está activo y tiene
 * identificador. No dibuja nada: el propio script agrega el botón flotante abajo a la derecha.
 * No se carga en el administrador, y nunca se inserta dos veces.
 */
const ChatbotWidget = () => {
  const { settings } = useSiteSettings();
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  const config = resolveChatbotConfig(settings);
  // En modo "launcher" el asistente se abre desde el botón flotante de la tienda (FloatingContact)
  const scriptMode = config?.mode === 'script';
  const botId = scriptMode ? config?.botId : undefined;
  const color = scriptMode ? config?.color : undefined;
  const scriptUrl = scriptMode ? config?.scriptUrl : undefined;

  useEffect(() => {
    if (!botId || !scriptUrl || isAdminRoute) return;
    if (document.querySelector(`script[${SCRIPT_MARK}]`)) return;

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    // setAttribute escapa el valor: el identificador ya está validado, pero así no hay inyección posible
    script.setAttribute('data-bot', botId);
    if (color) script.setAttribute('data-color', color);
    script.setAttribute(SCRIPT_MARK, '1');
    document.body.appendChild(script);
  }, [botId, color, scriptUrl, isAdminRoute]);

  return null;
};

export default ChatbotWidget;
