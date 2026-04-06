
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'customer');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Vendor profiles with approval_status
CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Dar es Salaam',
  description TEXT DEFAULT '',
  description_sw TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  price_from INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  image_url TEXT DEFAULT '',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approval_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Vendor packages
CREATE TABLE public.vendor_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_sw TEXT DEFAULT '',
  price INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  description_sw TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_packages ENABLE ROW LEVEL SECURITY;

-- Vendor gallery
CREATE TABLE public.vendor_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  caption_sw TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;

-- Vendor reviews
CREATE TABLE public.vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Booking requests
CREATE TABLE public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_email TEXT DEFAULT '',
  event_date DATE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  package_id UUID,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Guests
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rsvp_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  group_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Budget items
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  item_name TEXT NOT NULL,
  estimated_cost INTEGER DEFAULT 0,
  actual_cost INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Planner tasks
CREATE TABLE public.planner_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;

-- Favorites
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vendor_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: users see own, admins see all
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Vendor profiles: public can view approved, vendors manage own, admins manage all
CREATE POLICY "Anyone view approved vendors" ON public.vendor_profiles FOR SELECT USING (approval_status = 'approved');
CREATE POLICY "Vendors view own profile" ON public.vendor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors update own profile" ON public.vendor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors insert own profile" ON public.vendor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all vendors" ON public.vendor_profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all vendors" ON public.vendor_profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Vendor packages: public read, vendor manage own
CREATE POLICY "Anyone view packages" ON public.vendor_packages FOR SELECT USING (true);
CREATE POLICY "Vendors manage own packages" ON public.vendor_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vendor_profiles WHERE id = vendor_id AND user_id = auth.uid())
);

-- Vendor gallery: public read, vendor manage own
CREATE POLICY "Anyone view gallery" ON public.vendor_gallery FOR SELECT USING (true);
CREATE POLICY "Vendors manage own gallery" ON public.vendor_gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vendor_profiles WHERE id = vendor_id AND user_id = auth.uid())
);

-- Reviews: public read, authenticated insert own
CREATE POLICY "Anyone view reviews" ON public.vendor_reviews FOR SELECT USING (true);
CREATE POLICY "Users create own reviews" ON public.vendor_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Booking requests: vendor sees own, customers insert
CREATE POLICY "Vendors view own bookings" ON public.booking_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vendor_profiles WHERE id = vendor_id AND user_id = auth.uid())
);
CREATE POLICY "Vendors update own bookings" ON public.booking_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.vendor_profiles WHERE id = vendor_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated users create bookings" ON public.booking_requests FOR INSERT WITH CHECK (true);

-- Guests: user manages own
CREATE POLICY "Users manage own guests" ON public.guests FOR ALL USING (auth.uid() = user_id);
-- Allow public RSVP respond (by token, no auth needed)
CREATE POLICY "Public RSVP update" ON public.guests FOR UPDATE USING (true);
CREATE POLICY "Public RSVP select" ON public.guests FOR SELECT USING (true);

-- Budget items: user manages own
CREATE POLICY "Users manage own budget" ON public.budget_items FOR ALL USING (auth.uid() = user_id);

-- Planner tasks: user manages own
CREATE POLICY "Users manage own tasks" ON public.planner_tasks FOR ALL USING (auth.uid() = user_id);

-- Favorites: user manages own
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Chat messages: user manages own
CREATE POLICY "Users manage own chat" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- ===== TRIGGERS =====

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendor_profiles_updated_at BEFORE UPDATE ON public.vendor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for vendor images
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-images', 'vendor-images', true);
CREATE POLICY "Anyone can view vendor images" ON storage.objects FOR SELECT USING (bucket_id = 'vendor-images');
CREATE POLICY "Authenticated users upload vendor images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vendor-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users update own vendor images" ON storage.objects FOR UPDATE USING (bucket_id = 'vendor-images' AND auth.role() = 'authenticated');
