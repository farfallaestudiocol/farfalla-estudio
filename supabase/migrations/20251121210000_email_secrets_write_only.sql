-- =====================================================================
-- La clave de API y el secreto del webhook de Fácil Correo pasan a ser de solo escritura
-- desde el navegador: nadie con sesión (ni siquiera un administrador) puede leerlos por la
-- API REST. Solo las edge functions (service_role) los leen. El formulario del admin lee
-- el estado por get_email_settings() (SECURITY DEFINER), que solo devuelve si están
-- configurados, y escribe con UPDATE.
-- =====================================================================
REVOKE SELECT ON public.email_settings FROM anon, authenticated;

GRANT SELECT (
  id, provider, is_enabled, api_base_url, sender_name, sender_email, reply_to_email,
  track_opens, track_clicks, extra_config, updated_by, created_at, updated_at
) ON public.email_settings TO authenticated;

-- api_key, api_secret y webhook_secret quedan SIN permiso de lectura para los roles de la API.
