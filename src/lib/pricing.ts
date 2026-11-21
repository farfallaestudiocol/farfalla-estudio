import type { SiteSettings } from '@/hooks/useSiteSettings';

// IMPORTANTE: estas reglas están duplicadas a propósito en el servidor
// (supabase/functions/create-order/index.ts), que es quien decide el total real y lo
// compara con lo que Wompi cobró. Si se cambia una regla aquí, hay que cambiarla allá,
// o los pagos se aprobarán pero el pedido será rechazado por "monto no coincide".

export type PricingSettings = Pick<
  SiteSettings,
  | 'shipping_enabled'
  | 'free_shipping_enabled'
  | 'free_shipping_minimum'
  | 'shipping_cost'
  | 'shipping_cost_bogota'
  | 'shipping_cost_outside_bogota'
  | 'tax_enabled'
  | 'tax_rate'
>;

interface AddressLike {
  city?: string | null;
  state?: string | null;
}

export const isBogotaAddress = (address: AddressLike | null | undefined): boolean =>
  !!address && (/bogot[aá]/i.test(address.city || '') || /bogot[aá]/i.test(address.state || ''));

export interface Totals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingApplied: boolean;
  bogotaRate: boolean;
}

export function calculateTotals(
  subtotal: number,
  settings: PricingSettings,
  address: AddressLike | null,
): Totals {
  const bogotaRate = isBogotaAddress(address);

  let shipping = 0;
  let freeShippingApplied = false;
  if (settings.shipping_enabled) {
    if (settings.free_shipping_enabled && subtotal >= (settings.free_shipping_minimum || 0)) {
      freeShippingApplied = true;
    } else {
      // Sin dirección todavía se usa la tarifa nacional
      shipping = bogotaRate
        ? settings.shipping_cost_bogota || settings.shipping_cost || 0
        : settings.shipping_cost_outside_bogota || settings.shipping_cost || 0;
    }
  }

  const tax = settings.tax_enabled ? Math.round(subtotal * (settings.tax_rate || 0)) : 0;

  return { subtotal, shipping, tax, total: subtotal + shipping + tax, freeShippingApplied, bogotaRate };
}

export function formatPrice(amount: number, currency = 'COP'): string {
  return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
