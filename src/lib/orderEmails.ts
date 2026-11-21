import { supabase } from '@/integrations/supabase/client';

/**
 * Pide al servidor enviar el correo que corresponde a un cambio de estado.
 * Solo funciona con sesión de administrador. Devuelve un texto de advertencia
 * si el correo no pudo enviarse (el cambio de estado ya está guardado).
 */
export async function notifyOrderStatus(orderId: string, status: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: { order_id: orderId, status },
    });
    if (error) {
      let msg = 'No se pudo enviar el correo al cliente';
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) msg = `Correo no enviado: ${body.error}`;
      } catch {
        // mensaje genérico
      }
      return msg;
    }
    if (data && data.success === false) return `Correo no enviado: ${data.error}`;
    return null;
  } catch {
    return 'No se pudo enviar el correo al cliente';
  }
}

export async function resendConfirmation(orderId: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('send-order-email', {
    body: { order_id: orderId, type: 'order_confirmation' },
  });
  if (error) return 'No se pudo reenviar el correo';
  if (data && data.success === false) return data.error || 'No se pudo reenviar el correo';
  return null;
}
