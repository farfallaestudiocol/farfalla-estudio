-- =====================================================================
-- Endurecimiento de seguridad (auditoría del 2025-11-21)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CRÍTICO: cualquier usuario podía volverse administrador.
--    La política "Users can update their own profile" permite actualizar
--    cualquier columna de la propia fila, incluida `role`.
--    Este trigger bloquea el cambio de rol salvo para administradores o para
--    sesiones internas (service_role / SQL Editor, donde auth.uid() es NULL).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado para cambiar el rol' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_guard_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_role();

-- ---------------------------------------------------------------------
-- 2. ALTO: cualquier usuario con sesión podía crear, editar y borrar
--    los banners de la portada. Ahora solo administradores.
-- ---------------------------------------------------------------------
ALTER POLICY "Only authenticated users can insert banner slides" ON public.banner_slides
  WITH CHECK (public.is_admin());
ALTER POLICY "Only authenticated users can update banner slides" ON public.banner_slides
  USING (public.is_admin());
ALTER POLICY "Only authenticated users can delete banner slides" ON public.banner_slides
  USING (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. ALTO: cualquier usuario con sesión podía insertar pedidos propios
--    directamente por la API (con total y estado de pago a su gusto),
--    saltándose create-order. Los pedidos solo los crea la edge function
--    (service role) tras verificar el pago; los administradores conservan
--    su política "Admins can manage all orders".
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- ---------------------------------------------------------------------
-- 4. MEDIO: funciones de trigger SECURITY DEFINER invocables por la API,
--    y funciones sin search_path fijo.
-- ---------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_primary_address() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('generate_order_number', 'get_frequently_bought_together', 'get_product_recommendations')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;
END;
$$;
