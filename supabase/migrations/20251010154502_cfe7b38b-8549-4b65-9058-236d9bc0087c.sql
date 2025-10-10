-- Add personalization_notes column to cart_items
ALTER TABLE cart_items
ADD COLUMN personalization_notes TEXT;

-- Add personalization_notes column to order_items  
ALTER TABLE order_items
ADD COLUMN personalization_notes TEXT;