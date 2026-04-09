-- Create conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Customers see their own conversations
CREATE POLICY "Customers view own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = customer_id);

-- Vendors see conversations for their vendor profile
CREATE POLICY "Vendors view own conversations"
ON public.chat_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_profiles
    WHERE vendor_profiles.id = chat_conversations.vendor_id
    AND vendor_profiles.user_id = auth.uid()
  )
);

-- Customers can create conversations
CREATE POLICY "Customers create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Allow updating updated_at
CREATE POLICY "Participants update conversation"
ON public.chat_conversations FOR UPDATE
USING (
  auth.uid() = customer_id
  OR EXISTS (
    SELECT 1 FROM public.vendor_profiles
    WHERE vendor_profiles.id = chat_conversations.vendor_id
    AND vendor_profiles.user_id = auth.uid()
  )
);

-- Add conversation_id and sender_id to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_id UUID;

-- Drop old policy that used user_id
DROP POLICY IF EXISTS "Users manage own chat" ON public.chat_messages;

-- New policies for direct messaging
CREATE POLICY "Participants view messages"
ON public.chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (
      c.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendor_profiles vp
        WHERE vp.id = c.vendor_id AND vp.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Participants send messages"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
    AND (
      c.customer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendor_profiles vp
        WHERE vp.id = c.vendor_id AND vp.user_id = auth.uid()
      )
    )
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
