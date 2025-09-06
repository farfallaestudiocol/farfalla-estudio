-- Add new logo settings for square and rectangular variants
INSERT INTO public.site_settings (setting_key, setting_value, description, setting_type) 
VALUES 
  ('logo_square_color_url', '', 'URL del logo cuadrado en colores', 'text'),
  ('logo_square_white_url', '', 'URL del logo cuadrado en blanco', 'text'),
  ('logo_rectangular_color_url', '', 'URL del logo rectangular en colores', 'text'),
  ('logo_rectangular_white_url', '', 'URL del logo rectangular en blanco', 'text')
ON CONFLICT (setting_key) DO NOTHING;