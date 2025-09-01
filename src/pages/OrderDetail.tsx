import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  total_amount: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: any;
  billing_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: any[];
}

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useOrders();
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setIsLoading(true);
      const orderData = await getOrder(orderId);
      setOrder(orderData);
      setIsLoading(false);
    };

    fetchOrder();
  }, [orderId, getOrder]);

  const formatPrice = (price: number, currency: string = 'COP') => {
    const locale = currency === 'COP' ? 'es-CO' : 'es-ES';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: 'Pendiente', 
        variant: 'secondary' as const, 
        icon: Clock 
      },
      processing: { 
        label: 'Procesando', 
        variant: 'default' as const, 
        icon: Package 
      },
      shipped: { 
        label: 'Enviado', 
        variant: 'secondary' as const, 
        icon: Truck 
      },
      delivered: { 
        label: 'Entregado', 
        variant: 'secondary' as const, 
        icon: CheckCircle 
      },
      cancelled: { 
        label: 'Cancelado', 
        variant: 'destructive' as const, 
        icon: XCircle 
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendiente', variant: 'secondary' as const },
      completed: { label: 'Pagado', variant: 'secondary' as const },
      failed: { label: 'Falló', variant: 'destructive' as const },
      refunded: { label: 'Reembolsado', variant: 'secondary' as const }
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;
    
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="farfalla-section-gradient py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
              Inicia sesión para ver el detalle del pedido
            </h2>
            <Link to="/auth">
              <Button className="farfalla-btn-primary">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="farfalla-section-gradient py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Package className="h-12 w-12 animate-pulse text-farfalla-teal mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando pedido...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="farfalla-section-gradient py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
              Pedido no encontrado
            </h2>
            <Link to="/mis-pedidos">
              <Button className="farfalla-btn-primary">
                Ver Mis Pedidos
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="farfalla-section-gradient py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/mis-pedidos" 
              className="inline-flex items-center text-muted-foreground hover:text-farfalla-teal transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a mis pedidos
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                  Pedido #{order.order_number}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Realizado el {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                {getStatusBadge(order.status)}
                {getPaymentStatusBadge(order.payment_status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Items */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="farfalla-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                    <Package className="h-5 w-5" />
                    Productos del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-poppins font-semibold text-farfalla-ink">
                          {item.product_name}
                        </h3>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">
                            Variante: {item.variant_name}
                          </p>
                        )}
                        {item.product_sku && (
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.product_sku}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm">Cantidad: {item.quantity}</span>
                          <span className="text-sm">
                            Precio: {formatPrice(item.unit_price, order.currency)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-poppins font-semibold text-farfalla-ink">
                          {formatPrice(item.total_price, order.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="farfalla-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{order.customer_email}</span>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{order.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {order.shipping_address && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-farfalla-ink mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Dirección de Envío
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{order.shipping_address.street}</p>
                          <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                          <p>{order.shipping_address.country} - {order.shipping_address.postal_code}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {order.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-farfalla-ink mb-2">Notas del Pedido</h4>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="farfalla-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                    <CreditCard className="h-5 w-5" />
                    Resumen del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>
                        {formatPrice(
                          order.total_amount - order.shipping_amount - order.tax_amount + order.discount_amount,
                          order.currency
                        )}
                      </span>
                    </div>

                    {order.shipping_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Envío</span>
                        <span>{formatPrice(order.shipping_amount, order.currency)}</span>
                      </div>
                    )}

                    {order.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>IVA</span>
                        <span>{formatPrice(order.tax_amount, order.currency)}</span>
                      </div>
                    )}

                    {order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span>
                        <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-poppins font-bold">
                      <span>Total</span>
                      <span className="text-farfalla-ink">
                        {formatPrice(order.total_amount, order.currency)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Information */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-farfalla-ink">Información de Pago</h4>
                    {order.payment_method && (
                      <p className="text-sm text-muted-foreground">
                        Método: {order.payment_method}
                      </p>
                    )}
                    {order.payment_reference && (
                      <p className="text-sm text-muted-foreground">
                        Referencia: {order.payment_reference}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Moneda: {order.currency}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="farfalla-card">
                  <CardHeader>
                    <CardTitle className="text-farfalla-ink">Panel de Admin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/admin/orders/${order.id}`}>
                      <Button variant="outline" className="w-full">
                        Gestionar Pedido
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderDetail;