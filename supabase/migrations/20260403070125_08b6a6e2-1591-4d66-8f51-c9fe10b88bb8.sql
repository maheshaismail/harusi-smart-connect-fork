
CREATE POLICY "Participants can update conversations"
  ON public.chat_conversations FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR vendor_id IN (SELECT vp.id FROM vendor_profiles vp WHERE vp.user_id = auth.uid())
  );
