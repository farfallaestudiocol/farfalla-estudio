-- Add theme_id to cart_items table
ALTER TABLE public.cart_items ADD COLUMN theme_id uuid REFERENCES public.themes(id);

-- Add theme columns to order_items table
ALTER TABLE public.order_items ADD COLUMN theme_id uuid REFERENCES public.themes(id);
ALTER TABLE public.order_items ADD COLUMN theme_name text;