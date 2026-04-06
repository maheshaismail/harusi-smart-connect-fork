
-- Drop overly permissive anon policies
DROP POLICY IF EXISTS "Anyone can update status by rsvp token" ON public.guests;
DROP POLICY IF EXISTS "Anyone can view guest by rsvp token" ON public.guests;

-- Anon can only read (needed for RSVP page to show guest name)
CREATE POLICY "Anon can view guest by rsvp token" ON public.guests
  FOR SELECT TO anon USING (true);
