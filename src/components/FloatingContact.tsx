import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveChatbotConfig } from '@/lib/chatbot';

/**
 * Botón flotante de contacto (abajo a la derecha).
 *
 * - Sin chatbot: abre directamente el mensaje de WhatsApp.
 * - Con chatbot activo (enlace «Abrir el chat» configurado): al pulsarlo muestra las dos
 *   opciones, el asistente virtual (con el nombre configurado) y WhatsApp.
 * - Con el widget de Fácil Correo en modo "script": el widget pone su propio botón abajo a la
 *   derecha, así que este pasa a la izquierda para no taparse.
 */
const FloatingContact = () => {
  const { settings } = useSiteSettings();
  const { pathname } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [message, setMessage] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const chatbot = resolveChatbotConfig(settings);
  const botInLauncher = chatbot?.mode === 'launcher';
  const botAsScript = chatbot?.mode === 'script';

  // wa.me exige solo dígitos con indicativo de país: se quitan espacios, "+", guiones y
  // paréntesis, y a un celular colombiano de 10 dígitos se le antepone el 57.
  const digits = (settings?.whatsapp_number || settings?.contact_phone || '').replace(/\D/g, '');
  const whatsappNumber = digits.length === 10 ? `57${digits}` : digits;

  // Cierra el menú al hacer clic fuera o con Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // El administrador no necesita el botón de contacto
  if (pathname.startsWith('/admin')) return null;

  const hasWhatsapp = !!whatsappNumber;
  const hasMenu = botInLauncher && hasWhatsapp;
  if (!hasWhatsapp && !botInLauncher) return null;

  const side = botAsScript ? 'left-6' : 'right-6';
  const menuSide = botAsScript ? 'left-0' : 'right-0';

  const openChat = () => {
    if (!chatbot?.chatUrl) return;
    // Ventana aparte; si el navegador la bloquea, se abre en una pestaña nueva
    const win = window.open(chatbot.chatUrl, 'farfalla-chatbot', 'width=420,height=700');
    if (win) win.opener = null;
    else window.open(chatbot.chatUrl, '_blank', 'noopener,noreferrer');
    setMenuOpen(false);
  };

  const openWhatsapp = () => {
    setMenuOpen(false);
    setWhatsappOpen(true);
  };

  const sendWhatsapp = () => {
    if (!message.trim()) return;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setMessage('');
    setWhatsappOpen(false);
  };

  // Qué hace el botón principal según lo que haya disponible
  const onFabClick = () => {
    if (hasMenu) setMenuOpen((o) => !o);
    else if (botInLauncher) openChat();
    else openWhatsapp();
  };

  const fabLabel = hasMenu ? 'Contáctanos' : botInLauncher ? `Chatear con ${chatbot?.name}` : 'Contactar por WhatsApp';
  const fabClass = hasMenu || botInLauncher ? 'bg-farfalla-teal hover:bg-farfalla-teal/90' : 'bg-[#25D366] hover:bg-[#128C7E]';

  return (
    <>
      <div ref={rootRef} className={`fixed bottom-6 ${side} z-50`}>
        {menuOpen && hasMenu && (
          <div
            role="menu"
            aria-label="Opciones de contacto"
            className={`absolute bottom-16 ${menuSide} w-72 rounded-xl border bg-background p-2 shadow-xl animate-in slide-in-from-bottom-2`}
          >
            <p className="px-3 pt-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">¿Cómo quieres hablar con nosotros?</p>
            <button
              type="button"
              role="menuitem"
              onClick={openChat}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-farfalla-teal text-white">
                <Bot className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-farfalla-ink">{chatbot?.name}</span>
                <span className="block text-xs text-muted-foreground">Asistente virtual · responde al instante</span>
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={openWhatsapp}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-muted"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-farfalla-ink">WhatsApp</span>
                <span className="block text-xs text-muted-foreground">Habla con una persona de nuestro equipo</span>
              </span>
            </button>
          </div>
        )}

        <Button
          onClick={onFabClick}
          aria-label={fabLabel}
          aria-haspopup={hasMenu ? 'menu' : undefined}
          aria-expanded={hasMenu ? menuOpen : undefined}
          className={`h-14 w-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 ${fabClass} ${menuOpen ? '' : 'animate-pulse'}`}
          size="icon"
        >
          {menuOpen ? <X className="h-6 w-6" /> : botInLauncher && !hasMenu ? <Bot className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {whatsappOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setWhatsappOpen(false)} />

          <Card className="relative w-full max-w-md animate-in slide-in-from-bottom-4 bg-gradient-to-br from-farfalla-pink-100 to-farfalla-teal-100 border-farfalla-pink-200 shadow-xl z-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-full bg-[#25D366] flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  Contactar por WhatsApp
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setWhatsappOpen(false)} className="h-8 w-8" aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label htmlFor="wa-message" className="text-sm font-medium text-muted-foreground mb-2 block">
                  Escribe tu mensaje:
                </label>
                <Textarea
                  id="wa-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hola! Estoy interesado en sus productos..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">{message.length}/500</div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setWhatsappOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={sendWhatsapp} disabled={!message.trim()} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default FloatingContact;
