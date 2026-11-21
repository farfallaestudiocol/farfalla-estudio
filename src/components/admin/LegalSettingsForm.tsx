import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Scale, TriangleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { POLICY_VERSION, formatPolicyDate, missingLegalFields, resolveLegalInfo } from '@/lib/legal';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Datos del responsable del tratamiento que aparecen en la política de privacidad y en los
 * términos. La ley exige identificar a quien trata los datos (nombre o razón social,
 * domicilio, correo y teléfono). Los vacíos se completan con los datos de contacto de la tienda.
 */
const LegalSettingsForm = () => {
  const { settings, refreshSettings } = useSiteSettings();
  const { toast } = useToast();

  const [legalName, setLegalName] = useState('');
  const [nit, setNit] = useState('');
  const [address, setAddress] = useState('');
  const [privacyEmail, setPrivacyEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!settings || loaded) return;
    setLegalName(settings.legal_company_name || '');
    setNit(settings.legal_nit || '');
    setAddress(settings.legal_address || '');
    setPrivacyEmail(settings.legal_privacy_email || '');
    setLoaded(true);
  }, [settings, loaded]);

  const save = async () => {
    if (privacyEmail.trim() && !EMAIL_RE.test(privacyEmail.trim())) {
      toast({ title: 'Correo inválido', description: 'Revisa el correo para consultas y reclamos de datos personales.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const row = (setting_key: string, value: string, description: string) => ({ setting_key, setting_value: value.trim(), setting_type: 'text', description });
      const { error } = await supabase.from('site_settings').upsert(
        [
          row('legal_company_name', legalName, 'Razón social o nombre del titular del negocio (políticas legales)'),
          row('legal_nit', nit, 'NIT o documento del titular (políticas legales)'),
          row('legal_address', address, 'Domicilio del responsable (políticas legales)'),
          row('legal_privacy_email', privacyEmail, 'Correo para consultas y reclamos de datos personales'),
        ],
        { onConflict: 'setting_key' },
      );
      if (error) throw error;
      await refreshSettings();
      toast({ title: 'Éxito', description: 'Datos legales guardados. Ya aparecen en las páginas de privacidad y términos.' });
    } catch (error) {
      console.error('Error saving legal settings:', error);
      toast({ title: 'Error', description: 'No se pudieron guardar los datos legales', variant: 'destructive' });
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

  // Lo que se publicaría hoy, con los valores ya guardados
  const missing = missingLegalFields(settings);
  const info = resolveLegalInfo(settings);

  return (
    <div className="space-y-6">
      {missing.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <TriangleAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Faltan datos para que la política cumpla con la ley</p>
            <p className="mt-1">
              La ley exige identificar al responsable del tratamiento de los datos. Completa antes de publicar:
            </p>
            <ul className="list-disc pl-5 mt-1">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Datos legales del responsable
          </CardTitle>
          <CardDescription>
            Aparecen en la <a className="underline" href="/privacidad" target="_blank" rel="noopener noreferrer">Política de privacidad</a> y en los{' '}
            <a className="underline" href="/terminos" target="_blank" rel="noopener noreferrer">Términos y condiciones</a>. Versión vigente {POLICY_VERSION} ({formatPolicyDate()}).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="legal_company_name">Razón social o nombre completo del titular</Label>
              <Input id="legal_company_name" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Como aparece en el RUT" />
              <p className="text-sm text-muted-foreground">Si queda vacío se usa «{info.brandName}».</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal_nit">NIT o número de documento</Label>
              <Input id="legal_nit" value={nit} onChange={(e) => setNit(e.target.value)} placeholder="Ej.: 900.123.456-7" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_address">Domicilio del responsable</Label>
            <Input id="legal_address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle o carrera, número" />
            <p className="text-sm text-muted-foreground">Si queda vacío se usa la dirección de contacto de la tienda: {settings.contact_address || '(sin configurar)'}.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_privacy_email">Correo para consultas y reclamos de datos personales</Label>
            <Input id="legal_privacy_email" type="email" value={privacyEmail} onChange={(e) => setPrivacyEmail(e.target.value)} placeholder="datos@tudominio.co" />
            <p className="text-sm text-muted-foreground">
              Los titulares usarán este correo para ejercer sus derechos. Debe ser uno que revises: la ley fija plazos de respuesta. Si queda vacío se usa el correo de contacto: {settings.contact_email || '(sin configurar)'}.
            </p>
          </div>

          <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-1">
            <p className="font-medium">Así se identificará el responsable</p>
            <p>{info.legalName}{info.nit ? ` · NIT ${info.nit}` : ''}</p>
            <p>{[info.address, info.city].filter(Boolean).join(', ') || '(sin domicilio)'}</p>
            <p>{[info.email, info.phone].filter(Boolean).join(' · ') || '(sin datos de contacto)'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="farfalla-btn-primary">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar datos legales
        </Button>
      </div>
    </div>
  );
};

export default LegalSettingsForm;
