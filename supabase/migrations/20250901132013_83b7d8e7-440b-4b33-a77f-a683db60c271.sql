-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  price INTEGER NOT NULL, -- Price in cents/pesos
  compare_price INTEGER, -- Original price for discounts
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}', -- Array of image URLs
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  sku TEXT,
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_content table for managing page content
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE, -- e.g., 'hero', 'about', 'benefits'
  title TEXT,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  button_text TEXT,
  button_url TEXT,
  content_data JSONB DEFAULT '{}', -- For flexible content structure
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for global configuration
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'text', -- text, number, boolean, json, color
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- user, admin
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active site content" ON public.site_content
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view site settings" ON public.site_settings
  FOR SELECT USING (true);

-- Create RLS policies for admin access
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial categories
INSERT INTO public.categories (name, slug, description, display_order) VALUES
('Invitaciones', 'invitaciones', 'Invitaciones personalizadas para bodas, quinceañeros y eventos especiales', 1),
('Decoración', 'decoracion', 'Flores de papel y elementos decorativos artesanales', 2),
('Recuerdos', 'recuerdos', 'Álbumes y libros personalizados para guardar tus memorias', 3),
('Papelería', 'papeleria', 'Cuadernos, tarjetas y productos de papelería artesanal', 4);

-- Insert initial site content
INSERT INTO public.site_content (section_key, title, subtitle, description, content_data) VALUES
('hero', 'Creaciones únicas', 'hechas a mano', 'Manualidades en papel personalizadas para tus momentos especiales. Cada pieza es única y creada especialmente para ti.', '{"badge_text": "✨ Creaciones Artesanales Únicas", "button_primary": "Personalizar Ahora", "button_secondary": "Ver Creaciones"}'),
('benefits', 'Nuestros Beneficios', '', 'Por qué elegir Farfalla Estudio', '{"benefits": [{"icon": "Truck", "title": "Envío Seguro", "description": "Empaque especial para proteger tus creaciones"}, {"icon": "Heart", "title": "Hecho a Mano", "description": "Cada pieza es única y personalizada"}, {"icon": "Scissors", "title": "Diseño Personalizado", "description": "Adaptamos cada creación a tus gustos"}, {"icon": "Gift", "title": "Para Ocasiones Especiales", "description": "Perfectas para momentos únicos"}]}'),
('specialties', 'Nuestras Especialidades', '', 'Explora nuestras creaciones artesanales en papel, perfectas para cada ocasión especial', '{}'),
('featured', 'Creaciones Destacadas', '', 'Nuestras piezas más populares, cada una hecha con amor y dedicación', '{}'),
('cta', 'Envío Gratis en Compras Superiores a $150.000', '', 'Recibe tus creaciones artesanales sin costo adicional. Entregas cuidadosas para preservar cada detalle.', '{"button_text": "Ver Creaciones"}');

-- Insert initial site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description) VALUES
('site_title', 'Farfalla Estudio', 'text', 'Título del sitio web'),
('site_description', 'Manualidades en papel personalizadas', 'text', 'Descripción del sitio web'),
('primary_color', '#1EAEDB', 'color', 'Color primario del sitio'),
('secondary_color', '#FF6B9D', 'color', 'Color secundario del sitio'),
('free_shipping_threshold', '150000', 'number', 'Umbral para envío gratis'),
('whatsapp_number', '', 'text', 'Número de WhatsApp para contacto'),
('instagram_url', '', 'text', 'URL de Instagram'),
('facebook_url', '', 'text', 'URL de Facebook');