import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GooglePlacesAutocomplete } from '@/components/GooglePlacesAutocomplete';
import { CheckoutAddress, CheckoutCustomer } from '@/lib/checkout';

interface DocumentType {
  id: string;
  code: string;
  name: string;
}

interface CheckoutFormProps {
  customer: CheckoutCustomer;
  onCustomerChange: (c: CheckoutCustomer) => void;
  // Solo se muestra el bloque de dirección cuando no se usan direcciones guardadas
  showAddress: boolean;
  address: CheckoutAddress;
  onAddressChange: (a: CheckoutAddress) => void;
  acceptedTerms: boolean;
  onAcceptedTermsChange: (v: boolean) => void;
}

const CheckoutForm = ({
  customer,
  onCustomerChange,
  showAddress,
  address,
  onAddressChange,
  acceptedTerms,
  onAcceptedTermsChange,
}: CheckoutFormProps) => {
  const { user, profile } = useAuth();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    supabase
      .from('document_types')
      .select('id, code, name')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data }) => setDocumentTypes(data || []));
  }, []);

  // Prellenado con los datos de la cuenta (solo campos aún vacíos)
  useEffect(() => {
    if (!user) return;
    const code = documentTypes.find((d) => d.id === (profile as any)?.document_type_id)?.code;
    onCustomerChange({
      ...customer,
      name: customer.name || profile?.full_name || '',
      email: customer.email || user.email || '',
      document_type: customer.document_type || code || '',
      document_number: customer.document_number || (profile as any)?.document_number || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, documentTypes]);

  const setC = (patch: Partial<CheckoutCustomer>) => onCustomerChange({ ...customer, ...patch });
  const setA = (patch: Partial<CheckoutAddress>) => onAddressChange({ ...address, ...patch });

  return (
    <div className="space-y-4 w-full">
      <h3 className="font-poppins font-semibold text-farfalla-ink">Tus datos</h3>

      <div className="space-y-2">
        <Label htmlFor="co-name">Nombre completo *</Label>
        <Input id="co-name" autoComplete="name" value={customer.name} onChange={(e) => setC({ name: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="co-email">Correo electrónico *</Label>
        <Input
          id="co-email"
          type="email"
          autoComplete="email"
          value={customer.email}
          onChange={(e) => setC({ email: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">Aquí te enviaremos la confirmación y el seguimiento de tu pedido.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="co-phone">Teléfono / WhatsApp *</Label>
        <Input id="co-phone" type="tel" autoComplete="tel" value={customer.phone} onChange={(e) => setC({ phone: e.target.value })} />
      </div>

      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2 space-y-2">
          <Label>Tipo doc. *</Label>
          <Select value={customer.document_type} onValueChange={(v) => setC({ document_type: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((d) => (
                <SelectItem key={d.id} value={d.code}>
                  {d.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 space-y-2">
          <Label htmlFor="co-doc">Número de documento *</Label>
          <Input id="co-doc" value={customer.document_number} onChange={(e) => setC({ document_number: e.target.value })} />
        </div>
      </div>

      {showAddress && (
        <div className="space-y-3 pt-2">
          <h3 className="font-poppins font-semibold text-farfalla-ink">Dirección de entrega</h3>
          <div className="space-y-2">
            <Label>Buscar dirección</Label>
            <GooglePlacesAutocomplete
              value={searchText}
              onChange={setSearchText}
              placeholder="Escribe tu dirección..."
              onPlaceSelect={(p) => {
                setSearchText(p.full_address);
                onAddressChange({
                  ...address,
                  full_address: p.full_address,
                  street_address: p.street_address,
                  city: p.city,
                  state: p.state,
                  postal_code: p.postal_code,
                  country: p.country || 'Colombia',
                  latitude: p.latitude,
                  longitude: p.longitude,
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="co-street">Dirección (calle, número, apto, barrio) *</Label>
            <Input
              id="co-street"
              autoComplete="street-address"
              value={address.street_address}
              onChange={(e) => setA({ street_address: e.target.value, full_address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="co-city">Ciudad *</Label>
              <Input id="co-city" autoComplete="address-level2" value={address.city} onChange={(e) => setA({ city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="co-state">Departamento *</Label>
              <Input id="co-state" autoComplete="address-level1" value={address.state} onChange={(e) => setA({ state: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 pt-2">
        <Checkbox id="co-terms" checked={acceptedTerms} onCheckedChange={(v) => onAcceptedTermsChange(v === true)} className="mt-1" />
        <Label htmlFor="co-terms" className="text-sm font-normal leading-snug">
          Acepto el tratamiento de mis datos personales para gestionar este pedido y recibir notificaciones sobre él.
        </Label>
      </div>
    </div>
  );
};

export default CheckoutForm;
