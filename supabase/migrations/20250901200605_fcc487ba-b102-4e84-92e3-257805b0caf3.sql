-- Insert site settings for contact information and branding
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
  ('company_name', 'Farfalla Estudio', 'text', 'Nombre de la empresa'),
  ('company_logo_url', '', 'text', 'URL del logo de la empresa'),
  ('company_description', 'Tu destino para productos de belleza de alta calidad. Descubre tu mejor versión con nuestra selección cuidadosamente curada.', 'textarea', 'Descripción de la empresa'),
  ('contact_email', 'hola@farfallaestudio.co', 'text', 'Email de contacto'),
  ('contact_phone', '+57 300 123 4567', 'text', 'Número de teléfono/WhatsApp'),
  ('contact_city', 'Bogotá', 'text', 'Ciudad donde se encuentra la empresa'),
  ('contact_address', 'Bogotá, Colombia', 'text', 'Dirección completa'),
  ('social_instagram', 'https://instagram.com/farfallaestudio', 'text', 'URL de Instagram'),
  ('social_facebook', 'https://facebook.com/farfallaestudio', 'text', 'URL de Facebook')
ON CONFLICT (setting_key) DO NOTHING;