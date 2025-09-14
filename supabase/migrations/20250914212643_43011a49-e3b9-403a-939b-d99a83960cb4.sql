-- Fix the function to have proper search_path
CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this address is being set as primary, unset all other primary addresses for this user
  IF NEW.is_primary = true THEN
    UPDATE public.user_addresses 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;