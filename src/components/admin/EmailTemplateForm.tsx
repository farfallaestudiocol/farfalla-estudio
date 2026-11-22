import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LayoutTemplate, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_ACCENT_COLOR, DEFAULT_BRAND_COLOR, DEFAULT_TEMPLATE, TEMPLATE_KEYS, EmailTemplate, isHexColor, isHttpsUrl, templateFromSettings,
} from '../../../supabase/functions/_shared/emailTemplate.ts';
import { COPY, OrderEmailType, renderOrderEmail } from '../../../supabase/functions/_shared/orderEmailContent.ts';

const TYPES: { type: OrderEmailType; label: string }[] = [
  { type: 'order_confirmation', label: 'Confirmación de pedido' },
  { type: 'status_processing', label: 'En preparación' },
  { type: 'status_shipped', label: 'Enviado' },
  { type: 'status_delivered', label: 'Entregado' },
  { type: 'status_cancelled', label: 'Cancelado' },
];

const SAMPLE_ORDER = {
  id: 'ejemplo', order_number: 'FE-000123', customer_name: 'Ana Pérez', customer_email: 'ana@ejemplo.com',
  total_amount: 98000, shipping_amount: 12000, tax_amount: 0, currency: 'COP', access_token: 'ejemplo',
  shipping_address: { full_address: 'Calle 100 # 15-20', city: 'Bogotá', state: 'Cundinamarca' },
};
const SAMPLE_ITEMS = [
  { product_name: 'Caja de regalo personalizada', variant_name: 'Mediana', theme_name: 'Mariposas', quantity: 1, total_price: 56000 },
  { product_name: 'Tarjeta de agradecimiento', variant_name: null, theme_name: null, quantity: 3, total_price: 30000 },
];

/**
 * Plantilla estándar de los correos: cabecera con logo/color, el mensaje en el centro y un pie.
 * El texto de introducción de cada tipo de correo se puede personalizar; el detalle del pedido
 * (productos, totales, dirección, botón de seguimiento) lo pone la tienda automáticamente.
 */
const EmailTemplateForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState('Farfalla Estudio');
  const [brandLogo, setBrandLogo] = useState('');
  const [tpl, setTpl] = useState<EmailTemplate>(DEFAULT_TEMPLATE);
  const [previewType, setPreviewType] = useState<OrderEmailType>('order_confirmation');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .or('setting_key.like.email_tpl_%,setting_key.in.(company_name,logo_rectangular_color_url,logo_color_url,company_logo_url)');
      const cfg: Record<string, string> = {};
      for (const r of data || []) cfg[r.setting_key] = r.setting_value ?? '';
      if (cfg.company_name) setCompany(cfg.company_name);
      setBrandLogo(templateFromSettings({ ...cfg, [TEMPLATE_KEYS.logoUrl]: '' }).logoUrl);
      // El campo guarda solo el logo propio de la plantilla; el de la marca se usa si está vacío
      setTpl({ ...templateFromSettings(cfg), logoUrl: (cfg[TEMPLATE_KEYS.logoUrl] || '').trim() });
      setLoading(false);
    })();
  }, []);

  const set = (patch: Partial<EmailTemplate>) => setTpl((t) => ({ ...t, ...patch }));
  const setIntro = (type: string, v: string) => setTpl((t) => ({ ...t, intros: { ...t.intros, [type]: v } }));

  const preview = useMemo(
    () => renderOrderEmail(previewType, SAMPLE_ORDER, SAMPLE_ITEMS, window.location.origin, company, {
      ...tpl,
      logoUrl: isHttpsUrl(tpl.logoUrl) ? tpl.logoUrl : brandLogo,
      intros: Object.fromEntries(Object.entries(tpl.intros).map(([k, v]) => [k, v.trim()])),
    }).html,
    [previewType, tpl, company, brandLogo],
  );

  const save = async () => {
    if (tpl.brandColor.trim() && !isHexColor(tpl.brandColor)) {
      toast({ title: 'Color inválido', description: 'Usa un color hexadecimal como #0f766e.', variant: 'destructive' });
      return;
    }
    if (tpl.accentColor.trim() && !isHexColor(tpl.accentColor)) {
      toast({ title: 'Color inválido', description: 'El acento debe ser un color hexadecimal como #F4B0B9.', variant: 'destructive' });
      return;
    }
    if (tpl.logoUrl.trim() && !isHttpsUrl(tpl.logoUrl)) {
      toast({ title: 'Logo inválido', description: 'La imagen debe tener una dirección que empiece por https://', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const row = (key: string, value: string, description: string) => ({ setting_key: key, setting_value: value, setting_type: 'text', description });
      const rows = [
        row(TEMPLATE_KEYS.logoUrl, tpl.logoUrl.trim(), 'Plantilla de correo: logo (https)'),
        row(TEMPLATE_KEYS.brandColor, tpl.brandColor.trim(), 'Plantilla de correo: color principal'),
        row(TEMPLATE_KEYS.accentColor, tpl.accentColor.trim(), 'Plantilla de correo: color de acento'),
        row(TEMPLATE_KEYS.headerText, tpl.headerText.trim(), 'Plantilla de correo: texto de la cabecera'),
        row(TEMPLATE_KEYS.footerText, tpl.footerText.trim(), 'Plantilla de correo: pie de página'),
        ...TYPES.map(({ type }) => row(TEMPLATE_KEYS.intro(type), (tpl.intros[type] || '').trim(), `Plantilla de correo: introducción «${type}»`)),
      ];
      const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'setting_key' });
      if (error) throw error;
      toast({ title: 'Éxito', description: 'Plantilla guardada. Se usa desde el próximo correo que se envíe.' });
    } catch (e) {
      console.error('Error saving email template:', e);
      toast({ title: 'Error', description: 'No se pudo guardar la plantilla', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-farfalla-teal" /></div>;
  }

  return (
    <Card className="farfalla-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5" />Plantilla de los correos</CardTitle>
        <CardDescription>
          Todos los correos de pedidos usan esta misma plantilla: cabecera con tu marca, el mensaje en el centro y un pie.
          El detalle del pedido y el botón «Ver el estado de mi pedido» se agregan solos.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tpl_color">Color principal</Label>
              <div className="flex items-center gap-2">
                <Input id="tpl_color" value={tpl.brandColor} onChange={(e) => set({ brandColor: e.target.value })} placeholder={DEFAULT_BRAND_COLOR} />
                {isHexColor(tpl.brandColor) && <span className="h-8 w-8 shrink-0 rounded border" style={{ backgroundColor: tpl.brandColor }} aria-label="Vista previa del color" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl_accent">Color de acento (franja)</Label>
              <div className="flex items-center gap-2">
                <Input id="tpl_accent" value={tpl.accentColor} onChange={(e) => set({ accentColor: e.target.value })} placeholder={DEFAULT_ACCENT_COLOR} />
                {isHexColor(tpl.accentColor) && <span className="h-8 w-8 shrink-0 rounded border" style={{ backgroundColor: tpl.accentColor }} aria-label="Vista previa del acento" />}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl_header">Texto de la cabecera</Label>
              <Input id="tpl_header" maxLength={80} value={tpl.headerText} onChange={(e) => set({ headerText: e.target.value })} placeholder={company} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl_logo">Logo propio para los correos (opcional)</Label>
            <Input id="tpl_logo" type="url" value={tpl.logoUrl} onChange={(e) => set({ logoUrl: e.target.value })} placeholder="https://…/logo.png" />
            <p className="text-sm text-muted-foreground">Si lo dejas vacío se usa el logo horizontal de la marca (Branding); si tampoco hay, el nombre de la tienda.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl_footer">Pie de página</Label>
            <Textarea id="tpl_footer" rows={3} maxLength={600} value={tpl.footerText} onChange={(e) => set({ footerText: e.target.value })} placeholder={`${company}\nBogotá, Colombia · contacto@farfallaestudio.com.co`} />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Mensaje de cada correo (opcional)</p>
            {TYPES.map(({ type, label }) => (
              <div key={type} className="space-y-1">
                <Label htmlFor={`tpl_intro_${type}`}>{label}</Label>
                <Textarea
                  id={`tpl_intro_${type}`} rows={2} maxLength={600}
                  value={tpl.intros[type] || ''}
                  onChange={(e) => setIntro(type, e.target.value)}
                  onFocus={() => setPreviewType(type)}
                  placeholder={COPY[type].intro}
                />
              </div>
            ))}
            <p className="text-sm text-muted-foreground">Se muestra debajo de «Hola, nombre del cliente,». Vacío = el texto por defecto.</p>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="farfalla-btn-primary">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar plantilla
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="tpl_preview_type">Vista previa</Label>
            <select
              id="tpl_preview_type" value={previewType}
              onChange={(e) => setPreviewType(e.target.value as OrderEmailType)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {TYPES.map(({ type, label }) => <option key={type} value={type}>{label}</option>)}
            </select>
          </div>
          <iframe title="Vista previa del correo" sandbox="" srcDoc={preview} className="h-[640px] w-full rounded-md border bg-white" />
          <p className="text-sm text-muted-foreground">Con datos de ejemplo. Para ver el correo real, usa «enviar correo de prueba» arriba.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateForm;
