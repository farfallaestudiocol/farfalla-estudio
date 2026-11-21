import { Loader2, MessageSquare } from 'lucide-react';
import { AddressSelector } from '@/components/AddressSelector';
import CheckoutForm from '@/components/CheckoutForm';
import WompiWidget from '@/components/WompiWidget';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CheckoutState } from '@/hooks/useCheckout';

/** Datos del comprador, dirección, notas y pago. Solo presenta lo que calcula useCheckout. */
export function CheckoutSection({ checkout }: { checkout: CheckoutState }) {
  const {
    user, settings, totals, customer, setCustomer, guestAddress, setGuestAddress,
    selectedAddressId, setSelectedAddressId, acceptedTerms, setAcceptedTerms, acceptedPrivacy, setAcceptedPrivacy,
    notes, setNotes, missingFields, beforePayment, completeOrder,
  } = checkout;

  return (
    <>
      <CheckoutForm
        customer={customer}
        onCustomerChange={setCustomer}
        showAddress={!user}
        address={guestAddress}
        onAddressChange={setGuestAddress}
        acceptedTerms={acceptedTerms}
        onAcceptedTermsChange={setAcceptedTerms}
        acceptedPrivacy={acceptedPrivacy}
        onAcceptedPrivacyChange={setAcceptedPrivacy}
      />

      {/* Usuarios con sesión: direcciones guardadas */}
      {user && (
        <div className="w-full min-w-0">
          <AddressSelector selectedAddressId={selectedAddressId} onAddressSelect={setSelectedAddressId} required={true} />
        </div>
      )}

      <div className="w-full space-y-2">
        <Label htmlFor="order-notes" className="flex items-center gap-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          Notas o instrucciones especiales
        </Label>
        <Textarea
          id="order-notes"
          placeholder="Indícanos que personalización deseas para tus productos"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none w-full"
        />
        <p className="text-xs text-muted-foreground">Opcional: Agrega cualquier instrucción especial para tu pedido</p>
      </div>

      <div className="w-full">
        {!settings || !totals ? (
          <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculando tu total...
          </div>
        ) : missingFields.length > 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-muted-foreground">
                <p className="mb-2">Completa estos datos para continuar con el pago</p>
                <div className="text-sm space-y-1">
                  {missingFields.map((f) => (
                    <p key={f}>• {f}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <WompiWidget
            amount={totals.total}
            currency={settings.currency}
            customerEmail={customer.email.trim()}
            customerName={customer.name.trim()}
            onBeforeOpen={beforePayment}
            onSuccess={completeOrder}
            onError={(error) => console.error('Payment error:', error)}
          />
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-center">Pago seguro con Wompi</div>
    </>
  );
}
