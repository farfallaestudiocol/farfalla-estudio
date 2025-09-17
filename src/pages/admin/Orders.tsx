import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter,
  Package, 
  CreditCard, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  payment_reference?: string;
  total_amount: number;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export default function AdminOrders() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  
  console.log('AdminOrders component loaded');
  console.log('User:', user?.email);
  console.log('IsAdmin:', isAdmin);
  console.log('Loading:', loading);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (paymentStatusFilter !== 'all') {
        query = query.eq('payment_status', paymentStatusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Error al cargar las órdenes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Estado de la orden actualizado",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Error al actualizar el estado de la orden",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Don't do anything while still loading auth
    if (loading) return;
    
    if (!user) {
      navigate('/admin');
      return;
    }
    fetchOrders();
  }, [user, loading, navigate, statusFilter, paymentStatusFilter]);

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatPrice = (price: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pendiente' },
      processing: { variant: 'default' as const, icon: RefreshCw, label: 'Procesando' },
      shipped: { variant: 'outline' as const, icon: Package, label: 'Enviado' },
      delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Entregado' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelado' }
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
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pendiente' },
      completed: { variant: 'default' as const, icon: CheckCircle, label: 'Completado' },
      paid: { variant: 'default' as const, icon: CheckCircle, label: 'Pagado' },
      failed: { variant: 'destructive' as const, icon: XCircle, label: 'Fallido' },
      refunded: { variant: 'outline' as const, icon: RefreshCw, label: 'Reembolsado' }
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Gestión de Órdenes
              </h1>
              <p className="text-muted-foreground mt-2">
                Administra todas las órdenes del sistema
              </p>
            </div>
            <Button onClick={fetchOrders} className="farfalla-btn-primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="farfalla-card mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-farfalla-ink font-poppins">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número, cliente o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de orden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="farfalla-card">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-farfalla-teal" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-poppins font-semibold text-farfalla-ink mb-2">No hay órdenes</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all' 
                    ? 'No se encontraron órdenes con los filtros aplicados'
                    : 'Aún no hay órdenes en el sistema'
                  }
                </p>
              </div>
          ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        {formatPrice(order.total_amount, order.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(order.status)}
                          <Select
                            value={order.status}
                            onValueChange={(value) => updateOrderStatus(order.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="processing">Procesando</SelectItem>
                              <SelectItem value="shipped">Enviado</SelectItem>
                              <SelectItem value="delivered">Entregado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(order.payment_status)}
                      </TableCell>
                      <TableCell>
                        {order.notes ? (
                          <div className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate" title={order.notes}>
                              {order.notes}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin notas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="farfalla-btn-secondary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}