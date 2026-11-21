import { supabase } from '@/integrations/supabase/client';

export interface CheckoutCustomer {
  name: string;
  email: string;
  phone: string;
  document_type: string;
  document_number: string;
}

export interface CheckoutAddress {
  name?: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CheckoutCartItem {
  product: { id: string };
  variant?: { id: string };
  theme_id?: string;
  quantity: number;
  personalization_notes?: string;
}

// Lo que se envía a create-order. Nunca incluye precios: el servidor los recalcula.
export interface CreateOrderPayload {
  customer: CheckoutCustomer;
  shipping_address: CheckoutAddress;
  items: {
    product_id: string;
    variant_id?: string | null;
    theme_id?: string | null;
    quantity: number;
    personalization_notes?: string | null;
  }[];
  notes?: string;
  accepted_terms: boolean;
}

export const emptyCustomer: CheckoutCustomer = {
  name: '',
  email: '',
  phone: '',
  document_type: '',
  document_number: '',
};

export const emptyAddress: CheckoutAddress = {
  full_address: '',
  street_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'Colombia',
  latitude: null,
  longitude: null,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve la lista de campos que faltan o son inválidos (vacía si todo está bien). */
export function validateCheckout(
  customer: CheckoutCustomer,
  address: CheckoutAddress | null,
  acceptedTerms: boolean,
): string[] {
  const problems: string[] = [];
  if (!customer.name.trim()) problems.push('Nombre completo');
  if (!EMAIL_RE.test(customer.email.trim())) problems.push('Correo electrónico válido');
  if (customer.phone.replace(/\D/g, '').length < 7) problems.push('Teléfono');
  if (!customer.document_type) problems.push('Tipo de documento');
  if (!customer.document_number.trim()) problems.push('Número de documento');
  if (!address || !address.street_address.trim() || !address.city.trim() || !address.state.trim()) {
    problems.push('Dirección de entrega (calle, ciudad y departamento)');
  }
  if (!acceptedTerms) problems.push('Aceptar términos y tratamiento de datos');
  return problems;
}

export function buildOrderPayload(
  cartItems: CheckoutCartItem[],
  customer: CheckoutCustomer,
  address: CheckoutAddress,
  notes: string,
): CreateOrderPayload {
  return {
    customer: { ...customer, email: customer.email.trim().toLowerCase() },
    shipping_address: address,
    items: cartItems.map((i) => ({
      product_id: i.product.id,
      variant_id: i.variant?.id ?? null,
      theme_id: i.theme_id ?? null,
      quantity: i.quantity,
      personalization_notes: i.personalization_notes ?? null,
    })),
    notes: notes.trim() || undefined,
    accepted_terms: true,
  };
}

export interface CreatedOrder {
  id: string;
  order_number: string;
  total_amount: number;
  access_token?: string;
}

export async function submitOrder(
  payload: CreateOrderPayload,
  paymentReference: string,
): Promise<{ order?: CreatedOrder; error?: string }> {
  // Con un error HTTP, supabase-js oculta el cuerpo; se lee para mostrar el motivo real.
  const { data, error } = await supabase.functions.invoke('create-order', {
    body: { ...payload, payment_reference: paymentReference },
  });

  if (error) {
    let message = 'No se pudo crear el pedido';
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // se conserva el mensaje genérico
    }
    return { error: message };
  }
  if (!data?.success) return { error: data?.error || 'No se pudo crear el pedido' };
  return { order: data.order as CreatedOrder };
}

// ---- Pago por redirección (PSE, Nequi, etc.) ----
// Si el pago termina en otra página, el widget no llama a onSuccess. Se guarda
// lo necesario para crear el pedido cuando el cliente vuelve a /payment-result.
const PENDING_KEY = 'farfalla_pending_checkout_v1';
const PENDING_TTL_MS = 2 * 60 * 60 * 1000;

export function savePendingCheckout(payload: CreateOrderPayload) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ at: Date.now(), payload }));
  } catch {
    // sin almacenamiento: solo funcionará el flujo con onSuccess
  }
}

export function takePendingCheckout(): CreateOrderPayload | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const { at, payload } = JSON.parse(raw);
    if (!payload || Date.now() - at > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return payload as CreateOrderPayload;
  } catch {
    return null;
  }
}

export function clearPendingCheckout() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // nada
  }
}
