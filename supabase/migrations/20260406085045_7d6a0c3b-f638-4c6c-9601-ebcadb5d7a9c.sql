
-- Fix overly permissive booking insert policy
DROP POLICY "Authenticated users create bookings" ON public.booking_requests;
CREATE POLICY "Authenticated users create bookings" ON public.booking_requests 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fix overly permissive guest update policy (RSVP is done via edge function with service role)
DROP POLICY "Public RSVP update" ON public.guests;
DROP POLICY "Public RSVP select" ON public.guests;
