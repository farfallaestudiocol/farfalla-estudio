-- Add image field to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN image_url TEXT;