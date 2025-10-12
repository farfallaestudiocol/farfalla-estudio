-- Update handle_new_user function to include document information
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  user_role TEXT DEFAULT 'user';
  doc_type_id UUID;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- If this is the first user, make them admin
  IF user_count = 1 THEN
    user_role = 'admin';
  END IF;

  -- Get document type ID if code is provided
  IF NEW.raw_user_meta_data->>'document_type_code' IS NOT NULL THEN
    SELECT id INTO doc_type_id 
    FROM public.document_types 
    WHERE code = NEW.raw_user_meta_data->>'document_type_code' 
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    document_type_id,
    document_number
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_role,
    doc_type_id,
    NEW.raw_user_meta_data->>'document_number'
  );
  RETURN NEW;
END;
$function$;