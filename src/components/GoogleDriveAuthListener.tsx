import { useEffect } from 'react';
import { toast } from 'sonner';

// Global listener for Google Drive OAuth popup messages
// Stores refresh_token in localStorage so any page can use it
export default function GoogleDriveAuthListener() {
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        let data: any = event?.data;
        if (!data) return;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch (_) {}
        }
        if (!data || typeof data !== 'object') return;
        if (data.type !== 'GOOGLE_DRIVE_AUTH_SUCCESS') return;

        const tokens = data.tokens || {};
        const refreshToken = tokens.refresh_token as string | undefined;

        if (refreshToken) {
          localStorage.setItem('google_drive_refresh_token', refreshToken);
          window.dispatchEvent(new CustomEvent('google-drive-auth-updated'));
          toast.success('Google Drive autorizado correctamente');
        } else {
          toast.error('No se recibió el refresh token de Google');
        }
      } catch (e) {
        console.error('Error handling Google Drive auth message:', e);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return null;
}
