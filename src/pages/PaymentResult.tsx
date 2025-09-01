import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Home, Package } from 'lucide-react';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  
  const transactionId = searchParams.get('id');
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    // Determine status based on URL parameters
    if (paymentStatus === 'APPROVED') {
      setStatus('success');
    } else if (paymentStatus === 'DECLINED' || paymentStatus === 'ERROR') {
      setStatus('failed');
    } else if (paymentStatus === 'PENDING') {
      setStatus('pending');
    } else {
      setStatus('failed');
    }
  }, [paymentStatus]);

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink mb-4">
                ¡Pago Exitoso!
              </h1>
              <p className="text-muted-foreground mb-6">
                Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación con los detalles de tu pedido.
              </p>
              {transactionId && (
                <p className="text-sm text-muted-foreground mb-6">
                  ID de transacción: <span className="font-mono">{transactionId}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
                <Link to="/mis-pedidos">
                  <Button className="farfalla-btn-primary w-full sm:w-auto">
                    <Package className="h-4 w-4 mr-2" />
                    Ver Mis Pedidos
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      case 'pending':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink mb-4">
                Pago Pendiente
              </h1>
              <p className="text-muted-foreground mb-6">
                Tu pago está siendo procesado. Te notificaremos cuando se complete la transacción.
              </p>
              {transactionId && (
                <p className="text-sm text-muted-foreground mb-6">
                  ID de transacción: <span className="font-mono">{transactionId}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      case 'failed':
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink mb-4">
                Pago Fallido
              </h1>
              <p className="text-muted-foreground mb-6">
                No pudimos procesar tu pago. Por favor, intenta nuevamente o contacta con nuestro soporte.
              </p>
              {transactionId && (
                <p className="text-sm text-muted-foreground mb-6">
                  ID de transacción: <span className="font-mono">{transactionId}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/carrito">
                  <Button className="farfalla-btn-primary w-full sm:w-auto">
                    Reintentar Pago
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Home className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-farfalla-teal border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Procesando resultado del pago...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="farfalla-section-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentResult;