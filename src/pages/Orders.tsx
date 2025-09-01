import { Link } from 'react-router-dom';
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
  Eye,
  ShoppingBag
} from 'lucide-react';

const Orders = () => {
  const { orders, isLoading } = useOrders();
  const { user, isAdmin } = useAuth();

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
              Inicia sesión para ver tus pedidos
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
              <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
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
              to="/" 
              className="inline-flex items-center text-muted-foreground hover:text-farfalla-teal transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                  Mis Pedidos
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gestiona y revisa el estado de tus pedidos
                </p>
              </div>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline">
                    Panel de Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
                  No tienes pedidos aún
                </h2>
                <p className="text-muted-foreground mb-6">
                  Cuando realices tu primera compra, aparecerá aquí
                </p>
                <Link to="/">
                  <Button className="farfalla-btn-primary">
                    Explorar Productos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="farfalla-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl font-poppins text-farfalla-ink">
                          Pedido #{order.order_number}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-farfalla-ink mb-2">Productos</h4>
                      <div className="space-y-2">
                        {order.order_items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.product_name}</span>
                              {item.variant_name && (
                                <span className="text-muted-foreground"> - {item.variant_name}</span>
                              )}
                              <span className="text-muted-foreground"> x{item.quantity}</span>
                            </div>
                            <span className="font-medium">
                              {formatPrice(item.total_price, order.currency)}
                            </span>
                          </div>
                        ))}
                        {(order.order_items?.length || 0) > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{(order.order_items?.length || 0) - 3} productos más
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Order Summary */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">
                          {order.payment_method && (
                            <p>Método de pago: {order.payment_method}</p>
                          )}
                          {order.customer_phone && (
                            <p>Teléfono: {order.customer_phone}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-poppins font-bold text-farfalla-ink">
                          {formatPrice(order.total_amount, order.currency)}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Link to={`/pedido/${order.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Orders;