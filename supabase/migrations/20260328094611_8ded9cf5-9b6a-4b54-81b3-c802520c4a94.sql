
-- Create public bucket for vendor images
INSERT INTO storage.buckets (id, name, public) VALUES ('vendor-images', 'vendor-images', true);

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Vendors can upload own images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own images
CREATE POLICY "Vendors can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'vendor-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own images
CREATE POLICY "Vendors can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'vendor-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public can view vendor images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vendor-images');

-- Add image_url column to vendor_packages
ALTER TABLE public.vendor_packages ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
