-- Create theme_elements table
CREATE TABLE public.theme_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_elements ENABLE ROW LEVEL SECURITY;

-- Create policies for theme_elements
CREATE POLICY "Theme elements are viewable by everyone" 
ON public.theme_elements 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert theme elements" 
ON public.theme_elements 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update theme elements" 
ON public.theme_elements 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Only admins can delete theme elements" 
ON public.theme_elements 
FOR DELETE 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_theme_elements_updated_at
  BEFORE UPDATE ON public.theme_elements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();