
-- Role enum
CREATE TYPE public.app_role AS ENUM ('vendor', 'customer', 'admin');

-- User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vendor profiles
CREATE TABLE public.vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name text NOT NULL,
  category text NOT NULL,
  city text NOT NULL DEFAULT 'Dar es Salaam',
  description text DEFAULT '',
  description_sw text DEFAULT '',
  image_url text DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  price_from integer NOT NULL DEFAULT 0,
  phone text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Vendor packages
CREATE TABLE public.vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_sw text DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  description text DEFAULT '',
  description_sw text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_packages ENABLE ROW LEVEL SECURITY;

-- Booking requests
CREATE TABLE public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  package_id uuid REFERENCES public.vendor_packages(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  event_date date,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Anyone can view vendor profiles" ON public.vendor_profiles
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Vendors can insert own profile" ON public.vendor_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Vendors can update own profile" ON public.vendor_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can view packages" ON public.vendor_packages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Vendors can manage own packages" ON public.vendor_packages
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own packages" ON public.vendor_packages
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can delete own packages" ON public.vendor_packages
  FOR DELETE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can create booking requests" ON public.booking_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Vendors can view own booking requests" ON public.booking_requests
  FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own booking requests" ON public.booking_requests
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM public.vendor_profiles WHERE user_id = auth.uid()));
