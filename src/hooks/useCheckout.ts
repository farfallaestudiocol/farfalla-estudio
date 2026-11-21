import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { calculateTotals } from '@/lib/pricing';
import {
  CheckoutAddress,
  CheckoutCustomer,
  buildOrderPayload,
  clearPendingCheckout,
  emptyAddress,
  emptyCustomer,
  savePendingCheckout,
  submitOrder,
  validateCheckout,
} from '@/lib/checkout';

/**
 * Todo el estado y la lógica del checkout (datos del comprador, dirección, totales,
 * validación y creación del pedido tras el pago). La pantalla solo lo muestra.
 */
export function useCheckout() {
  const { user } = useAuth();
  const { items, getCartTotal, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const { addresses } = useUserAddresses();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCustomer);
  const [guestAddress, setGuestAddress] = useState<CheckoutAddress>(emptyAddress);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [notes, setNotes] = useState('');

  // Usuario con sesión: dirección guardada elegida. Invitado: la escrita en el formulario.
  const address = useMemo<CheckoutAddress | null>(() => {
    if (!user) return guestAddress;
    const saved = addresses.find((a) => a.id === selectedAddressId);
    if (!saved) return null;
    return {
      name: saved.name,
      full_address: saved.full_address,
      street_address: saved.street_address,
      city: saved.city,
      state: saved.state,
      postal_code: saved.postal_code || undefined,
      country: saved.country,
      phone: saved.phone || undefined,
      latitude: saved.latitude,
      longitude: saved.longitude,
    };
  }, [user, guestAddress, addresses, selectedAddressId]);

  // Las tarifas de la tienda se cargan aparte: hasta entonces no se puede cobrar, porque
  // el monto sería distinto al que calcula el servidor y el pedido se rechazaría.
  const settingsReady = settings !== null;
  const totals = settings ? calculateTotals(getCartTotal(), settings, address) : null;

  const missingFields = validateCheckout(customer, address, acceptedTerms);
  const orderPayload =
    missingFields.length === 0 && address ? buildOrderPayload(items, customer, address, notes) : null;

  /** Se guarda antes de abrir Wompi: si el pago sale a otra página (PSE), /payment-result lo retoma. */
  const beforePayment = () => {
    if (orderPayload) savePendingCheckout(orderPayload);
  };

  /** Pago aprobado en el widget: se crea el pedido en el servidor y se lleva al cliente a su seguimiento. */
  const completeOrder = async (result: { transaction?: { id?: string } }) => {
    const reference = result.transaction?.id;
    if (!orderPayload || !reference) {
      toast.error('No se pudo registrar el pedido. Contacta a soporte con tu ID de transacción.');
      return;
    }
    const { order, error } = await submitOrder(orderPayload, reference);
    if (error || !order) {
      toast.error(
        `${error || 'Error al crear el pedido'}. Tu pago fue aprobado; contacta a soporte con el ID de transacción ${reference}.`,
      );
      return;
    }
    clearPendingCheckout();
    toast.success('¡Pedido creado exitosamente!');
    await clearCart();
    navigate(user || !order.access_token ? '/mis-pedidos' : `/pedido/seguimiento?token=${order.access_token}`);
  };

  return {
    user,
    settings,
    settingsReady,
    totals,
    customer,
    setCustomer,
    guestAddress,
    setGuestAddress,
    selectedAddressId,
    setSelectedAddressId,
    acceptedTerms,
    setAcceptedTerms,
    notes,
    setNotes,
    address,
    missingFields,
    beforePayment,
    completeOrder,
  };
}

export type CheckoutState = ReturnType<typeof useCheckout>;
