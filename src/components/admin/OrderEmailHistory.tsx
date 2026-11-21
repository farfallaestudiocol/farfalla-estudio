import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Eye, RefreshCw } from 'lucide-react';
import { resendConfirmation } from '@/lib/orderEmails';
import { useToast } from '@/hooks/use-toast';

const db = supabase as any;

interface EmailEvent {
  id: string;
  email_type: string;
  recipient: string;
  status: string;
  error: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  first_opened_at: string | null;
  open_count: number;
  click_count: number;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  order_confirmation: 'Confirmación de pedido',
  status_processing: 'Pedido en preparación',
  status_shipped: 'Pedido enviado',
  status_delivered: 'Pedido entregado',
  status_cancelled: 'Pedido cancelado',
};

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  queued: { label: 'En cola', variant: 'outline' },
  sent: { label: 'Enviado', variant: 'secondary' },
  delivered: { label: 'Entregado', variant: 'secondary' },
  opened: { label: 'Abierto', variant: 'default' },
  clicked: { label: 'Clic', variant: 'default' },
  bounced: { label: 'Rebotó', variant: 'destructive' },
  failed: { label: 'Falló', variant: 'destructive' },
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('es-CO') : null);

const OrderEmailHistory = ({ orderId }: { orderId: string }) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db
      .from('email_events')
      .select('id, email_type, recipient, status, error, sent_at, delivered_at, first_opened_at, open_count, click_count, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const resend = async () => {
    setResending(true);
    const err = await resendConfirmation(orderId);
    toast(err
      ? { title: 'Error', description: err, variant: 'destructive' }
      : { title: 'Correo reenviado' });
    setResending(false);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-farfalla-ink">
          <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Correos al cliente</span>
          <Button variant="outline" size="sm" onClick={resend} disabled={resending}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reenviar confirmación
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
        {!loading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no se ha enviado ningún correo para este pedido.</p>
        )}
        {events.map((e) => {
          const st = STATUS_LABEL[e.status] || { label: e.status, variant: 'outline' as const };
          return (
            <div key={e.id} className="rounded-md border p-3 text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{TYPE_LABEL[e.email_type] || e.email_type}</span>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
              <p className="text-muted-foreground">Enviado a {e.recipient}{e.sent_at ? ` · ${fmt(e.sent_at)}` : ''}</p>
              {e.first_opened_at && (
                <p className="flex items-center gap-1 text-green-700">
                  <Eye className="h-3 w-3" /> Abierto {e.open_count} {e.open_count === 1 ? 'vez' : 'veces'} · primera: {fmt(e.first_opened_at)}
                  {e.click_count > 0 ? ` · ${e.click_count} clic(s)` : ''}
                </p>
              )}
              {e.error && <p className="text-destructive">{e.error}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default OrderEmailHistory;
