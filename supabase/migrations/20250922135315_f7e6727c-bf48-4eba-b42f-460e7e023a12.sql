-- Add phone field to user_addresses table
ALTER TABLE public.user_addresses 
ADD COLUMN phone text;