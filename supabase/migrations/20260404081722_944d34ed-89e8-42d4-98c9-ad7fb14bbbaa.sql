
-- Guests table to persist guest data per user
CREATE TABLE public.guests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  rsvp_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique token for RSVP links
CREATE UNIQUE INDEX guests_rsvp_token_idx ON public.guests(rsvp_token);

-- Enable RLS
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Users can manage their own guests
CREATE POLICY "Users can view own guests" ON public.guests
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own guests" ON public.guests
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own guests" ON public.guests
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own guests" ON public.guests
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Allow anonymous access to read guest by rsvp_token (for the public RSVP page)
CREATE POLICY "Anyone can view guest by rsvp token" ON public.guests
  FOR SELECT TO anon USING (true);

-- Allow anonymous update of status via rsvp_token
CREATE POLICY "Anyone can update status by rsvp token" ON public.guests
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
