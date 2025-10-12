-- Create document types table
CREATE TABLE public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_types
CREATE POLICY "Anyone can view active document types"
  ON public.document_types
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage document types"
  ON public.document_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Add document columns to profiles
ALTER TABLE public.profiles
ADD COLUMN document_type_id UUID REFERENCES public.document_types(id),
ADD COLUMN document_number TEXT;

-- Insert common Colombian document types
INSERT INTO public.document_types (code, name, description, display_order) VALUES
  ('CC', 'Cédula de Ciudadanía', 'Documento de identidad para ciudadanos colombianos mayores de 18 años', 1),
  ('TI', 'Tarjeta de Identidad', 'Documento de identidad para menores de edad', 2),
  ('CE', 'Cédula de Extranjería', 'Documento de identidad para extranjeros residentes en Colombia', 3),
  ('PA', 'Pasaporte', 'Documento de identidad internacional', 4),
  ('RC', 'Registro Civil', 'Documento de identidad para menores de 7 años', 5),
  ('NIT', 'NIT', 'Número de Identificación Tributaria', 6);

-- Create trigger for updated_at
CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();