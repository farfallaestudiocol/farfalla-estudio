import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Mail, Save, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { functionUrl } from '@/lib/config';
import { readFunctionError } from '@/lib/functionErrors';

// Las tablas/funciones nuevas aún no están en types.ts (se genera con
// `supabase gen types`), por eso se accede sin tipado estricto.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface PublicEmailSettings {
  provider: string;
  is_enabled: boolean;
  api_base_url: string | null;
  has_api_key: boolean;
  has_webhook_secret: boolean;
  sender_name: string | null;
  sender_email: string | null;
  reply_to_email: string | null;
  track_opens: boolean;
  track_clicks: boolean;
}

const WEBHOOK_URL = functionUrl('facilcorreo-webhook');
const DEFAULT_API_URL = 'https://app.facil-apps.com.co';

const EmailSettingsForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [current, setCurrent] = useState<PublicEmailSettings | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [testEmail, setTestEmail] = useState('');

  // Los secretos nunca se leen de vuelta: el campo queda vacío y solo se
  // envía si el admin escribe un valor nuevo.
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await db.rpc('get_email_settings');
    if (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración de correo. ¿Ya se aplicó la migración?',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    const s: PublicEmailSettings | undefined = Array.isArray(data) ? data[0] : data;
    if (s) {
      setCurrent(s);
      setIsEnabled(s.is_enabled);
      setApiBaseUrl(s.api_base_url || '');
      setSenderName(s.sender_name || '');
      setSenderEmail(s.sender_email || '');
      setReplyTo(s.reply_to_email || '');
      setTrackOpens(s.track_opens);
      setTrackClicks(s.track_clicks);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    if (isEnabled && (!senderEmail.trim() || !(apiKey || current?.has_api_key))) {
      toast({
        title: 'Faltan datos',
        description: 'Para activar el envío se requiere la clave de API y el correo remitente',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const update: Record<string, unknown> = {
        is_enabled: isEnabled,
        api_base_url: apiBaseUrl.trim().replace(/\/+$/, '') || null,
        sender_name: senderName.trim() || null,
        sender_email: senderEmail.trim() || null,
        reply_to_email: replyTo.trim() || null,
        track_opens: trackOpens,
        track_clicks: trackClicks,
        updated_by: user?.id ?? null,
      };
      if (apiKey) update.api_key = apiKey.trim();
      if (webhookSecret) update.webhook_secret = webhookSecret.trim();

      const { error } = await db.from('email_settings').update(update).eq('id', 1);
      if (error) throw error;

      setApiKey('');
      setWebhookSecret('');
      toast({ title: 'Éxito', description: 'Configuración de correo guardada' });
      await load();
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la configuración', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!testEmail.trim()) return;
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: { type: 'test', to: testEmail.trim() },
      });
      // Con error HTTP supabase-js oculta el cuerpo; se lee el motivo real (dominio sin verificar, clave inválida...)
      if (error) throw new Error((await readFunctionError(error)) || 'No se pudo enviar');
      if (!data?.success) throw new Error(data?.error || 'No se pudo enviar');
      toast({
        title: 'Prueba aceptada por Fácil Correo',
        description: 'Quedó en cola. Si la clave es de modo test, valida todo pero no envía ningún correo.',
      });
    } catch (error) {
      toast({
        title: 'Error al enviar la prueba',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-farfalla-teal" />
      </div>
    );
  }

  const secretBadge = (has: boolean) =>
    has ? <Badge variant="secondary">Configurada</Badge> : <Badge variant="outline">Sin configurar</Badge>;

  return (
    <div className="space-y-6">
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Proveedor de correo: Fácil Correo
          </CardTitle>
          <CardDescription>
            Con esto se notifica a los clientes (registrados o no) sobre su pedido y se registra si abrieron el correo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-medium">Antes de activar el envío</p>
            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
              <li>En Fácil Correo, agrega y <strong>verifica el dominio</strong> desde el que se enviará (registros DNS de propiedad y DKIM; SPF y retorno de rebotes son recomendados).</li>
              <li>Crea una <strong>clave de API</strong> con los permisos <code>send</code> y <code>read_events</code>. Se muestra una sola vez: pégala aquí.</li>
              <li>Empieza con una clave de <strong>modo test</strong> (valida todo y no envía a nadie). Cuando todo funcione, cambia a una clave <strong>live</strong>.</li>
              <li>El correo remitente debe ser de ese dominio verificado.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_enabled">Envío de correos activo</Label>
              <p className="text-sm text-muted-foreground">Si está apagado, los pedidos se crean pero no se envían correos.</p>
            </div>
            <Switch id="email_enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_base_url">Dirección de la API</Label>
            <Input
              id="api_base_url"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={DEFAULT_API_URL}
            />
            <p className="text-sm text-muted-foreground">
              La que le entregó Fácil Correo, sin <code>/v1/messages</code>. Si se deja vacía se usa {DEFAULT_API_URL}.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="api_key">Clave de API</Label>
              {secretBadge(!!current?.has_api_key)}
            </div>
            <Input
              id="api_key"
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={current?.has_api_key ? '•••••••• (dejar vacío para conservar)' : 'Pega la clave de API'}
            />
            <p className="text-sm text-muted-foreground">
              Se guarda donde solo la lee el servidor; esta pantalla nunca la muestra de vuelta. Si se filtra, revócala en Fácil Correo y pega otra.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sender_name">Nombre del remitente</Label>
              <Input id="sender_name" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Farfalla Estudio" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender_email">Correo remitente</Label>
              <Input id="sender_email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="pedidos@tudominio.co" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reply_to">Responder a</Label>
              <Input id="reply_to" type="email" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="hola@tudominio.co" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="track_opens">Rastrear aperturas</Label>
              <Switch id="track_opens" checked={trackOpens} onCheckedChange={setTrackOpens} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="track_clicks">Rastrear clics</Label>
              <Switch id="track_clicks" checked={trackClicks} onCheckedChange={setTrackClicks} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Webhook: entregas, rebotes, quejas y aperturas
          </CardTitle>
          <CardDescription>
            Sin esto, Fácil Correo acepta los correos pero la tienda no se entera de si llegaron o se abrieron.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>1. URL del webhook</Label>
            <Input readOnly value={WEBHOOK_URL} onFocus={(e) => e.currentTarget.select()} />
            <p className="text-sm text-muted-foreground">
              En Fácil Correo, sección Webhooks, crea uno con esta URL. Eventos recomendados: <code>message.sent</code>, <code>message.delivered</code>,{' '}
              <code>message.deferred</code>, <code>message.bounced</code>, <code>message.complained</code>, <code>message.opened</code>,{' '}
              <code>message.clicked</code>, <code>message.failed</code> y <code>message.suppressed</code> (sin elegir eventos recibe todos).
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook_secret">2. Secreto de firma</Label>
              {secretBadge(!!current?.has_webhook_secret)}
            </div>
            <Input
              id="webhook_secret"
              type="password"
              autoComplete="new-password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={current?.has_webhook_secret ? '•••••••• (dejar vacío para conservar)' : 'Pega el secreto que muestra Fácil Correo'}
            />
            <p className="text-sm text-muted-foreground">
              Fácil Correo lo muestra <strong>una sola vez</strong> al crear el webhook. Sin él, la tienda rechaza todos los eventos (es lo que impide que alguien falsifique avisos).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex gap-2 md:max-w-md md:flex-1">
          <Input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Correo para enviar una prueba"
          />
          <Button variant="outline" onClick={sendTest} disabled={testing || !testEmail.trim()}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Probar
          </Button>
        </div>
        <Button onClick={save} disabled={saving} className="farfalla-btn-primary">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar configuración
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Guarda antes de probar: la prueba usa la configuración ya guardada.
      </p>
    </div>
  );
};

export default EmailSettingsForm;
