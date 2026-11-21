import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Loader2, Package, Truck, XCircle, Home } from 'lucide-react';

interface TrackedOrder {
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  shipping_amount: number | null;
  tax_amount: number | null;
  currency: string;
  customer_name: string;
  shipping_address: { full_address?: string; city?: string; state?: string } | null;
  notes: string | null;
  created_at: string;
}

interface TrackedItem {
  product_name: string;
  variant_name: string | null;
  theme_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  personalization_notes: string | null;
}

const STATUS: Record<string, { label: string; icon: typeof Clock; description: string }> = {
  pending: { label: 'Pedido recibido', icon: Clock, description: 'Recibimos tu pedido y tu pago. Pronto comenzaremos a prepararlo.' },
  processing: { label: 'En preparación', icon: Package, description: 'Estamos preparando tu pedido.' },
  shipped: { label: 'Enviado', icon: Truck, description: 'Tu pedido va en camino.' },
  delivered: { label: 'Entregado', icon: CheckCircle, description: 'Tu pedido fue entregado.' },
  cancelled: { label: 'Cancelado', icon: XCircle, description: 'Este pedido fue cancelado.' },
};

const GuestOrderTracking = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [items, setItems] = useState<TrackedItem[]>([]);

  useEffect(() => {
    if (!token) {
      setError('El enlace de seguimiento no es válido.');
      setLoading(false);
      return;
    }
    supabase.functions
      .invoke('get-guest-order', { body: { token } })
      .then(async ({ data, error: fnError }) => {
        if (fnError || !data?.success) {
          setError('No encontramos un pedido con este enlace. Revisa el correo de confirmación.');
        } else {
          setOrder(data.order);
          setItems(data.items);
        }
        setLoading(false);
      });
  }, [token]);

  const money = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: order?.currency || 'COP', minimumFractionDigits: 0 }).format(n);

  const st = order ? STATUS[order.status] || STATUS.pending : null;
  const Icon = st?.icon;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-farfalla-teal" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-muted-foreground">{error}</p>
              <Link to="/"><Button variant="outline"><Home className="h-4 w-4 mr-2" />Volver al inicio</Button></Link>
            </CardContent>
          </Card>
        )}

        {order && st && Icon && (
          <>
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                <Icon className="h-14 w-14 text-farfalla-teal mx-auto" />
                <h1 className="text-2xl font-poppins font-bold text-farfalla-ink">Hola {order.customer_name.split(' ')[0]}, gracias por tu compra</h1>
                <p className="text-muted-foreground">Pedido <span className="font-mono font-semibold">{order.order_number}</span></p>
                <Badge className="text-sm">{st.label}</Badge>
                <p className="text-sm text-muted-foreground">{st.description}</p>
                <p className="text-xs text-muted-foreground">
                  Guarda esta página o el correo de confirmación: es tu enlace para consultar el pedido sin necesidad de cuenta.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-farfalla-ink">Productos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((i, idx) => (
                  <div key={idx} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium">{i.product_name} <span className="text-muted-foreground">× {i.quantity}</span></p>
                      {(i.variant_name || i.theme_name) && (
                        <p className="text-xs text-muted-foreground">{[i.variant_name, i.theme_name].filter(Boolean).join(' · ')}</p>
                      )}
                      {i.personalization_notes && (
                        <p className="text-xs text-muted-foreground">Personalización: {i.personalization_notes}</p>
                      )}
                    </div>
                    <span>{money(i.total_price)}</span>
                  </div>
                ))}
                <Separator />
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Envío</span><span>{money(order.shipping_amount || 0)}</span></div>
                  <div className="flex justify-between"><span>Impuestos</span><span>{money(order.tax_amount || 0)}</span></div>
                  <div className="flex justify-between font-semibold text-base"><span>Total</span><span>{money(order.total_amount)}</span></div>
                </div>
              </CardContent>
            </Card>

            {order.shipping_address && (
              <Card>
                <CardHeader><CardTitle className="text-farfalla-ink">Dirección de entrega</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  {order.shipping_address.full_address}
                  {order.shipping_address.city ? `, ${order.shipping_address.city}` : ''}
                  {order.shipping_address.state ? `, ${order.shipping_address.state}` : ''}
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Link to="/"><Button variant="outline"><Home className="h-4 w-4 mr-2" />Seguir comprando</Button></Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default GuestOrderTracking;
