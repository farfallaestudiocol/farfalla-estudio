-- Create banner_slides table for carousel configuration
CREATE TABLE public.banner_slides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT DEFAULT 'Ver Más',
  button_link TEXT DEFAULT '/',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_slides ENABLE ROW LEVEL SECURITY;

-- Create policies for banner slides (public read, admin only write)
CREATE POLICY "Banner slides are viewable by everyone" 
ON public.banner_slides 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert banner slides" 
ON public.banner_slides 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update banner slides" 
ON public.banner_slides 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete banner slides" 
ON public.banner_slides 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add trigger for timestamps
CREATE TRIGGER update_banner_slides_updated_at
BEFORE UPDATE ON public.banner_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default banner slide
INSERT INTO public.banner_slides (title, subtitle, description, image_url, button_text, button_link, display_order) VALUES 
('Creaciones únicas', 'hechas a mano', 'Manualidades en papel personalizadas para tus momentos especiales. Cada pieza es única y creada especialmente para ti.', 'https://drive.google.com/file/d/1example/view', 'Personalizar Ahora', '/', 1);