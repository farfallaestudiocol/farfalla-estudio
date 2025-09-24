-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_themes junction table (many-to-many relationship)
CREATE TABLE public.product_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, theme_id, variant_id)
);

-- Enable Row Level Security
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_themes ENABLE ROW LEVEL SECURITY;

-- Policies for themes (viewable by everyone, manageable by admins)
CREATE POLICY "Themes are viewable by everyone" 
ON public.themes 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert themes" 
ON public.themes 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update themes" 
ON public.themes 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Only admins can delete themes" 
ON public.themes 
FOR DELETE 
USING (public.is_admin());

-- Policies for product_themes (viewable by everyone, manageable by admins)
CREATE POLICY "Product themes are viewable by everyone" 
ON public.product_themes 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert product themes" 
ON public.product_themes 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update product themes" 
ON public.product_themes 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Only admins can delete product themes" 
ON public.product_themes 
FOR DELETE 
USING (public.is_admin());

-- Create indexes for better performance
CREATE INDEX idx_themes_active ON public.themes(is_active);
CREATE INDEX idx_product_themes_product_id ON public.product_themes(product_id);
CREATE INDEX idx_product_themes_theme_id ON public.product_themes(theme_id);
CREATE INDEX idx_product_themes_variant_id ON public.product_themes(variant_id);

-- Create trigger for automatic timestamp updates on themes
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();