
-- Gallery/portfolio images for vendors
CREATE TABLE public.vendor_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text DEFAULT '',
  caption_sw text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery
CREATE POLICY "Anyone can view gallery" ON public.vendor_gallery
  FOR SELECT TO anon, authenticated USING (true);

-- Vendors can manage own gallery
CREATE POLICY "Vendors can insert own gallery" ON public.vendor_gallery
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can update own gallery" ON public.vendor_gallery
  FOR UPDATE TO authenticated
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Vendors can delete own gallery" ON public.vendor_gallery
  FOR DELETE TO authenticated
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

-- Vendor reviews (public, no auth needed to submit for now)
CREATE TABLE public.vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.vendor_reviews
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can submit reviews" ON public.vendor_reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);
