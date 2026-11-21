import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_WIDGET_SCRIPT_URL, isValidColor, isValidScriptUrl, parseInstallInput } from '@/lib/chatbot';

/**
 * Chatbot web de Fácil Correo (manual, sección 12). Aquí solo se guarda el identificador
 * público del chatbot; las credenciales de canales como WhatsApp se conectan en el panel
 * de Fácil Correo y no hacen falta para el widget web.
 */
const ChatbotSettingsForm = () => {
  const { settings, refreshSettings } = useSiteSettings();
  const { toast } = useToast();

  const [enabled, setEnabled] = useState(false);
  const [installInput, setInstallInput] = useState('');
  const [color, setColor] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const savedBotId = settings?.chatbot_bot_id || '';

  // Se rellena una sola vez al llegar los ajustes
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!settings || loaded) return;
    setEnabled(settings.chatbot_enabled);
    setColor(settings.chatbot_color || '');
    setScriptUrl(settings.chatbot_script_url || '');
    setLoaded(true);
  }, [settings, loaded]);

  const parsed = installInput.trim() ? parseInstallInput(installInput) : null;
  const inputInvalid = installInput.trim() !== '' && !parsed;

  const onInstallChange = (value: string) => {
    setInstallInput(value);
    const p = parseInstallInput(value);
    // Si el código trae color o dirección del script, se toman de ahí
    if (p?.color) setColor(p.color);
    if (p?.scriptUrl && p.scriptUrl !== DEFAULT_WIDGET_SCRIPT_URL) setScriptUrl(p.scriptUrl);
  };

  const save = async () => {
    const botId = parsed?.botId || savedBotId;

    if (inputInvalid) {
      toast({
        title: 'No se reconoce el identificador',
        description: 'Pega el código de instalación completo o solo el identificador (por ejemplo bt_xxxxxxxx).',
        variant: 'destructive',
      });
      return;
    }
    if (enabled && !botId) {
      toast({ title: 'Falta el identificador', description: 'Para activar el chatbot pega su identificador o código de instalación.', variant: 'destructive' });
      return;
    }
    if (color.trim() && !isValidColor(color.trim())) {
      toast({ title: 'Color inválido', description: 'Usa un color hexadecimal como #1f5fd1.', variant: 'destructive' });
      return;
    }
    if (scriptUrl.trim() && !isValidScriptUrl(scriptUrl.trim())) {
      toast({ title: 'Dirección del script inválida', description: 'Debe ser una dirección https que termine en /widget.js.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const rows = [
        { setting_key: 'chatbot_enabled', setting_value: String(enabled), setting_type: 'boolean', description: 'Mostrar el chatbot web de Fácil Correo en la tienda' },
        { setting_key: 'chatbot_bot_id', setting_value: botId, setting_type: 'text', description: 'Identificador público del chatbot (data-bot)' },
        { setting_key: 'chatbot_color', setting_value: color.trim(), setting_type: 'text', description: 'Color del widget del chatbot (opcional)' },
        { setting_key: 'chatbot_script_url', setting_value: scriptUrl.trim(), setting_type: 'text', description: 'Dirección del script del widget (vacío = la de Fácil Correo por defecto)' },
      ];
      const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'setting_key' });
      if (error) throw error;

      setInstallInput('');
      await refreshSettings();
      toast({
        title: 'Éxito',
        description: enabled
          ? 'Chatbot guardado. Aparece en la tienda; si ya tenías la tienda abierta, recárgala para verlo.'
          : 'Chatbot guardado (desactivado).',
      });
    } catch (error) {
      console.error('Error saving chatbot settings:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la configuración del chatbot', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-farfalla-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chatbot con IA para la tienda
          </CardTitle>
          <CardDescription>
            Un asistente virtual que responde a los visitantes con la información de tu negocio. Se muestra como un botón flotante abajo a la derecha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-medium">Antes de activarlo, en el panel de Fácil Correo</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>Entra a <strong>Chatbots → Nuevo chatbot</strong> (si no aparece, pide que activen el chatbot en tu plan).</li>
              <li>En <strong>Configuración</strong> completa el mensaje de bienvenida, el tono y la política de privacidad. En <strong>sitios permitidos</strong> agrega esta tienda: <code>{window.location.origin}</code>. Si lo dejas vacío, el chatbot puede aparecer en cualquier sitio.</li>
              <li>En <strong>Conocimiento</strong> carga las preguntas frecuentes, textos, productos y precios. El chatbot solo responde con lo que cargues.</li>
              <li>En <strong>Instalación</strong> copia el código y pégalo aquí abajo. No hace falta pegarlo en el código de la tienda.</li>
            </ol>
            <p className="text-muted-foreground">
              No necesitas credenciales de WhatsApp para el chatbot web. Conectar WhatsApp, Messenger o Instagram se hace aparte, en la pestaña Canales de Fácil Correo.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="chatbot_enabled">Mostrar el chatbot en la tienda</Label>
              <p className="text-sm text-muted-foreground">No aparece en el administrador. Si está activo, el botón de WhatsApp pasa a la izquierda para no taparse.</p>
            </div>
            <Switch id="chatbot_enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="chatbot_install">Código de instalación o identificador</Label>
              {savedBotId ? <Badge variant="secondary">Configurado: {savedBotId}</Badge> : <Badge variant="outline">Sin configurar</Badge>}
            </div>
            <Textarea
              id="chatbot_install"
              rows={3}
              className="font-mono text-sm"
              value={installInput}
              onChange={(e) => onInstallChange(e.target.value)}
              placeholder={savedBotId ? 'Déjalo vacío para conservar el actual, o pega uno nuevo' : '<script src="…/widget.js" data-bot="bt_xxxxxxxx" async></script>   o solo   bt_xxxxxxxx'}
            />
            {parsed && (
              <p className="text-sm text-green-700">
                Reconocido: identificador <code>{parsed.botId}</code>
                {parsed.color ? <> · color <code>{parsed.color}</code></> : null}
              </p>
            )}
            {inputInvalid && <p className="text-sm text-destructive">No se reconoce un identificador válido en ese texto.</p>}
            <p className="text-sm text-muted-foreground">
              El identificador es público por diseño (va en el código de cualquier página donde aparezca el chat); no es una credencial.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chatbot_color">Color del botón (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input id="chatbot_color" value={color} onChange={(e) => setColor(e.target.value)} placeholder="#1f5fd1" />
                {isValidColor(color.trim()) && (
                  <span className="h-8 w-8 shrink-0 rounded border" style={{ backgroundColor: color.trim() }} aria-label="Vista previa del color" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatbot_script_url">Dirección del script (avanzado)</Label>
              <Input id="chatbot_script_url" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)} placeholder={DEFAULT_WIDGET_SCRIPT_URL} />
              <p className="text-sm text-muted-foreground">Déjalo vacío salvo que Fácil Correo te haya dado otra dirección.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="farfalla-btn-primary">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar chatbot
        </Button>
      </div>
    </div>
  );
};

export default ChatbotSettingsForm;
