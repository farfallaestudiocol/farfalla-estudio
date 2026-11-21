import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { resolveChatbotConfig } from '@/lib/chatbot';

const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { settings } = useSiteSettings();

  // Número configurable desde Configuración: primero "whatsapp_number" y, si está vacío,
  // el teléfono de contacto. wa.me exige solo dígitos con indicativo de país, así que se
  // quitan espacios, "+", guiones y paréntesis, y a un celular colombiano de 10 dígitos se
  // le antepone el 57.
  const digits = (settings?.whatsapp_number || settings?.contact_phone || '').replace(/\D/g, '');
  const whatsappNumber = digits.length === 10 ? `57${digits}` : digits;

  // Sin número configurado no se muestra el botón (abriría un chat vacío)
  if (!whatsappNumber) return null;

  // El chatbot web aparece abajo a la derecha: si está activo, WhatsApp pasa a la izquierda
  // para que los dos botones no se tapen.
  const side = resolveChatbotConfig(settings) ? 'left-6' : 'right-6';

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    // Format the WhatsApp URL with the message
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // Reset and close
    setMessage('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <div className={`fixed bottom-6 ${side} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* WhatsApp Message Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <Card className="relative w-full max-w-md animate-in slide-in-from-bottom-4 bg-gradient-to-br from-farfalla-pink-100 to-farfalla-teal-100 border-farfalla-pink-200 shadow-xl z-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="h-8 w-8 rounded-full bg-[#25D366] flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  Contactar por WhatsApp
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Escribe tu mensaje:
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hola! Estoy interesado en sus productos..."
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {message.length}/500
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white"
                >
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

export default WhatsAppWidget;