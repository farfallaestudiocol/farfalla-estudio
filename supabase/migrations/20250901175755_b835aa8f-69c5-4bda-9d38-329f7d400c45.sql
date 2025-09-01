-- Add shipping configuration settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
('shipping_enabled', 'true', 'boolean', 'Habilitar cálculo de envío'),
('free_shipping_enabled', 'true', 'boolean', 'Habilitar envío gratis'),
('free_shipping_minimum', '150000', 'number', 'Monto mínimo para envío gratis (en centavos)'),
('shipping_cost', '15000', 'number', 'Costo de envío estándar (en centavos)'),
('tax_enabled', 'true', 'boolean', 'Habilitar cálculo de IVA'),
('tax_rate', '0.19', 'number', 'Tasa de IVA (0.19 = 19%)'),
('currency', 'COP', 'text', 'Moneda del sitio')
ON CONFLICT (setting_key) DO UPDATE SET
setting_value = EXCLUDED.setting_value,
description = EXCLUDED.description;