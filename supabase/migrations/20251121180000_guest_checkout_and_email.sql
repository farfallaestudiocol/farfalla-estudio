-- =====================================================================
-- Checkout de invitado + integración de correo (Fácil Correo)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Credenciales del proveedor de correo
--    NO van en site_settings porque esa tabla es de lectura pública.
--    Solo admins pueden leer/escribir; las edge functions leen con
--    la service role key (que ignora RLS).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- fila única
  provider TEXT NOT NULL DEFAULT 'facilcorreo',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  api_base_url TEXT,
  api_key TEXT,
  api_secret TEXT,
  webhook_secret TEXT,
  sender_name TEXT,
  sender_email TEXT,
  reply_to_email TEXT,
  track_opens BOOLEAN NOT NULL DEFAULT true,
  track_clicks BOOLEAN NOT NULL DEFAULT true,
  extra_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email settings"
ON public.email_settings
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE TRIGGER update_email_settings_updated_at
BEFORE UPDATE ON public.email_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Lectura para el formulario del admin: nunca devuelve los secretos,
-- solo si están configurados.
CREATE OR REPLACE FUNCTION public.get_email_settings()
RETURNS TABLE (
  provider TEXT,
  is_enabled BOOLEAN,
  api_base_url TEXT,
  has_api_key BOOLEAN,
  has_api_secret BOOLEAN,
  has_webhook_secret BOOLEAN,
  sender_name TEXT,
  sender_email TEXT,
  reply_to_email TEXT,
  track_opens BOOLEAN,
  track_clicks BOOLEAN,
  extra_config JSONB,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
  SELECT s.provider, s.is_enabled, s.api_base_url,
         (s.api_key IS NOT NULL AND s.api_key <> ''),
         (s.api_secret IS NOT NULL AND s.api_secret <> ''),
         (s.webhook_secret IS NOT NULL AND s.webhook_secret <> ''),
         s.sender_name, s.sender_email, s.reply_to_email,
         s.track_opens, s.track_clicks, s.extra_config, s.updated_at
  FROM public.email_settings s
  WHERE s.id = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_email_settings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_email_settings() TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Datos de compra sin registro en orders
-- ---------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS customer_document_type TEXT,
  ADD COLUMN IF NOT EXISTS customer_document_number TEXT,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS orders_access_token_key ON public.orders (access_token);

-- Evita duplicar pedidos si el mismo pago se procesa dos veces
-- (el navegador reintenta, o llega el webhook además del widget).
CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_reference_key
  ON public.orders (payment_method, payment_reference)
  WHERE payment_reference IS NOT NULL AND payment_reference <> '';

-- ---------------------------------------------------------------------
-- 3. Registro de correos enviados y su seguimiento
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,            -- order_confirmation, status_update, ...
  recipient TEXT NOT NULL,
  subject TEXT,
  provider TEXT NOT NULL DEFAULT 'facilcorreo',
  provider_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued', -- queued, sent, delivered, opened, clicked, bounced, failed
  error TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  open_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  raw_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_events_order_idx ON public.email_events (order_id);
CREATE INDEX IF NOT EXISTS email_events_provider_msg_idx ON public.email_events (provider_message_id);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Solo admins leen. Las escrituras las hacen las edge functions (service role).
CREATE POLICY "Admins can view email events"
ON public.email_events
FOR SELECT
USING (public.is_admin());

CREATE TRIGGER update_email_events_updated_at
BEFORE UPDATE ON public.email_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
