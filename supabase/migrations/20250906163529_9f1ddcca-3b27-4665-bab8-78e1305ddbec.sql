-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Create RLS policies for logo uploads
CREATE POLICY "Admins can upload logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'logos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'logos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'logos' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'logos');

-- Add logo settings to site_settings
INSERT INTO public.site_settings (setting_key, setting_value, description, setting_type) 
VALUES 
  ('logo_color_url', '', 'URL del logo en colores', 'text'),
  ('logo_white_url', '', 'URL del logo en blanco', 'text')
ON CONFLICT (setting_key) DO NOTHING;