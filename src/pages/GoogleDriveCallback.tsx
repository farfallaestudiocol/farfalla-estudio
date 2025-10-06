import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function GoogleDriveCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google Drive auth error:', error);
      toast.error('Error en la autorización de Google Drive');
      
      // Enviar error al padre y cerrar
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_DRIVE_AUTH_ERROR',
          error: error
        }, '*');
      }
      
      // Cerrar después de mostrar error
      setTimeout(() => {
        window.close();
      }, 2000);
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      toast.error('No se recibió código de autorización');
      setTimeout(() => window.close(), 2000);
      return;
    }

    // Intercambiar código por tokens
    const exchangeCode = async () => {
      try {
        const response = await fetch('https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-auth/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al intercambiar código por tokens');
        }

        // Enviar tokens al padre
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
            tokens: data
          }, '*');
        }

        toast.success('¡Autorización exitosa!');
        
        // Cerrar inmediatamente después del éxito
        setTimeout(() => {
          window.close();
        }, 500);

      } catch (error) {
        console.error('Error exchanging code:', error);
        toast.error('Error al completar la autorización');
        
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_DRIVE_AUTH_ERROR',
            error: error.message
          }, '*');
        }
        
        setTimeout(() => window.close(), 2000);
      }
    };

    exchangeCode();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <h1 className="text-2xl font-semibold">Completando autorización...</h1>
        <p className="text-muted-foreground">
          Procesando los permisos de Google Drive. Esta ventana se cerrará automáticamente.
        </p>
      </div>
    </div>
  );
}