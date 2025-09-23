-- Add shipping rates configuration for Bogotá and outside Bogotá
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
('shipping_cost_bogota', '10000', 'number', 'Costo de envío dentro de Bogotá (COP)'),
('shipping_cost_outside_bogota', '25000', 'number', 'Costo de envío fuera de Bogotá (COP)')
ON CONFLICT (setting_key) DO NOTHING;