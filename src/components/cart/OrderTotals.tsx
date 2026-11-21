import { Truck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatPrice, PricingSettings, Totals } from '@/lib/pricing';

interface OrderTotalsProps {
  totals: Totals;
  settings: PricingSettings & { currency: string };
  itemCount: number;
  hasAddress: boolean;
}

/** Desglose de subtotal, envío, impuestos y total. */
export function OrderTotals({ totals, settings, itemCount, hasAddress }: OrderTotalsProps) {
  const money = (n: number) => formatPrice(n, settings.currency);
  const missingForFreeShipping = (settings.free_shipping_minimum || 0) - totals.subtotal;

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <span>Subtotal ({itemCount} productos)</span>
        <span>{money(totals.subtotal)}</span>
      </div>

      {settings.shipping_enabled && (
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span>Envío</span>
            {hasAddress && (
              <span className="text-xs text-muted-foreground">{totals.bogotaRate ? 'Tarifa Bogotá' : 'Tarifa Nacional'}</span>
            )}
          </div>
          <span className={totals.shipping === 0 ? 'text-green-600 font-medium' : ''}>
            {totals.shipping === 0 ? 'Gratis' : money(totals.shipping)}
          </span>
        </div>
      )}

      {settings.tax_enabled && totals.tax > 0 && (
        <div className="flex justify-between">
          <span>IVA ({Math.round((settings.tax_rate || 0) * 100)}%)</span>
          <span>{money(totals.tax)}</span>
        </div>
      )}

      {totals.freeShippingApplied && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Truck className="h-4 w-4" />
          <span>¡Envío gratis aplicado!</span>
        </div>
      )}

      {settings.free_shipping_enabled && totals.shipping > 0 && missingForFreeShipping > 0 && (
        <div className="text-sm text-muted-foreground">Agrega {money(missingForFreeShipping)} más para envío gratis</div>
      )}

      <Separator />

      <div className="flex justify-between text-lg font-poppins font-bold">
        <span>Total</span>
        <span className="text-farfalla-ink">{money(totals.total)}</span>
      </div>
    </div>
  );
}
