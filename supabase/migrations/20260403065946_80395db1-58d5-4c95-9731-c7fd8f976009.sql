
-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, vendor_id)
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: participants can view their own conversations
CREATE POLICY "Customers can view own conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can view own conversations"
  ON public.chat_conversations FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT vp.id FROM vendor_profiles vp WHERE vp.user_id = auth.uid()));

-- Customers can start conversations
CREATE POLICY "Customers can create conversations"
  ON public.chat_conversations FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Messages: participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
  ON public.chat_messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      WHERE cc.customer_id = auth.uid()
         OR cc.vendor_id IN (SELECT vp.id FROM vendor_profiles vp WHERE vp.user_id = auth.uid())
    )
  );

-- Participants can send messages
CREATE POLICY "Participants can send messages"
  ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT cc.id FROM chat_conversations cc
      WHERE cc.customer_id = auth.uid()
         OR cc.vendor_id IN (SELECT vp.id FROM vendor_profiles vp WHERE vp.user_id = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
