-- Insert Wompi environment setting
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('wompi_environment', 'test', 'select', 'Ambiente de Wompi (test o production)')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  setting_type = EXCLUDED.setting_type,
  description = EXCLUDED.description;