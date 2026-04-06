
-- Add customer_id to booking_requests so customers can track their bookings
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add reminder_sent_at column for tracking reminders
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;

-- Allow authenticated customers to view their own booking requests
CREATE POLICY "Customers can view own booking requests"
ON public.booking_requests
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Allow authenticated users to insert with their own customer_id
DROP POLICY IF EXISTS "Anyone can create booking requests" ON public.booking_requests;
CREATE POLICY "Authenticated users can create booking requests"
ON public.booking_requests
FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());
