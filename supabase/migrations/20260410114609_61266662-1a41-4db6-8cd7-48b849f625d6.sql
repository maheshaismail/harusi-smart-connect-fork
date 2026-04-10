
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Determine account type from metadata (default: customer)
  IF COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer') = 'vendor' THEN
    -- Insert vendor role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'vendor')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create vendor profile from metadata
    INSERT INTO public.vendor_profiles (user_id, business_name, category, city, description, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'Unnamed Business'),
      COALESCE(NEW.raw_user_meta_data->>'category', 'other'),
      COALESCE(NEW.raw_user_meta_data->>'city', 'Dar es Salaam'),
      COALESCE(NEW.raw_user_meta_data->>'description', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', '')
    );
  ELSE
    -- Insert customer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
