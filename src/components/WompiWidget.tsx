import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface WompiWidgetProps {
  amount: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  onSuccess?: (transactionData: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

const WompiWidget = ({ 
  amount, 
  currency, 
  customerEmail, 
  customerName,
  onSuccess,
  onError 
}: WompiWidgetProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Load Wompi script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.wompi.co/widget.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FARFALLA-${timestamp}-${random}`;
  };

  const handlePayment = async () => {
    if (!isScriptLoaded || !window.WidgetCheckout) {
      toast.error('El sistema de pagos no está disponible');
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique reference
      const reference = generateReference();

      // Get signature from edge function
      const { data: signatureData, error } = await supabase.functions.invoke('generate-wompi-signature', {
        body: {
          amount,
          currency,
          reference
        }
      });

      if (error) throw error;

      const { signature, amountInCents, publicKey, environment } = signatureData;

      console.log('Wompi payment data:', {
        publicKey,
        currency,
        amountInCents,
        reference,
        signature,
        environment
      });

      // Configure Wompi widget
      const checkout = new window.WidgetCheckout({
        currency,
        amountInCents,
        reference,
        publicKey,
        redirectUrl: `${window.location.origin}/payment-result`, // We'll create this page
        signature: {
          integrity: signature
        },
        customerData: {
          email: customerEmail,
          fullName: customerName || customerEmail
        }
      });

      // Open the widget
      checkout.open((result: any) => {
        console.log('Wompi result:', result);
        
        if (result.transaction && result.transaction.status === 'APPROVED') {
          toast.success('¡Pago exitoso!');
          onSuccess?.(result);
        } else if (result.transaction && result.transaction.status === 'DECLINED') {
          toast.error('Pago rechazado');
          onError?.(result);
        } else if (result.transaction && result.transaction.status === 'ERROR') {
          toast.error('Error en el pago');
          onError?.(result);
        }
        
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error al procesar el pago');
      onError?.(error);
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-farfalla-teal" />
            <h3 className="font-poppins font-semibold text-farfalla-ink">
              Pago Seguro
            </h3>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Pagos seguros con Wompi</p>
            <p>• Tarjetas de crédito y débito</p>
            <p>• PSE y otros métodos de pago</p>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={isLoading || !isScriptLoaded}
            className="farfalla-btn-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pagar {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 0
                }).format(amount)}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WompiWidget;