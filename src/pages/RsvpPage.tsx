import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Heart, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RsvpPage = () => {
  const { token } = useParams<{ token: string }>();
  const [guest, setGuest] = useState<{ id: string; name: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState(false);
  const [finalStatus, setFinalStatus] = useState('');

  useEffect(() => {
    if (!token) return;
    supabase
      .from('guests')
      .select('id, name, status')
      .eq('rsvp_token', token)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setGuest(data);
          if (data.status !== 'pending') {
            setResponded(true);
            setFinalStatus(data.status);
          }
        }
        setLoading(false);
      });
  }, [token]);

  const respond = async (status: 'confirmed' | 'declined') => {
    setSubmitting(true);
    const { data } = await supabase.functions.invoke('rsvp-respond', {
      body: { token, status },
    });
    if (data?.success) {
      setFinalStatus(status);
      setResponded(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold">Invalid RSVP Link</h1>
          <p className="text-muted-foreground mt-2">This invitation link is not valid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border-2 border-primary/20 bg-card p-8 text-center shadow-xl space-y-6"
      >
        <Heart className="h-10 w-10 text-primary fill-primary/20 mx-auto" />
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-medium mb-2">Wedding Invitation</p>
          <h1 className="text-2xl font-display font-bold">Hello, {guest.name}!</h1>
          <p className="text-muted-foreground mt-2">You have been cordially invited. Please confirm your attendance.</p>
        </div>

        {responded ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="space-y-3"
          >
            {finalStatus === 'confirmed' ? (
              <>
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-lg font-semibold text-green-600">You have confirmed! 🎉</p>
                <p className="text-sm text-muted-foreground">We look forward to celebrating with you.</p>
              </>
            ) : (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-lg font-semibold text-destructive">You have declined.</p>
                <p className="text-sm text-muted-foreground">We'll miss you! You can change your mind anytime.</p>
              </>
            )}
            {finalStatus === 'declined' && (
              <button
                onClick={() => { setResponded(false); }}
                className="text-sm text-primary underline mt-2"
              >
                Change my response
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => respond('confirmed')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <CheckCircle className="h-5 w-5" />
              {submitting ? '...' : "I'll Attend"}
            </button>
            <button
              onClick={() => respond('declined')}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-destructive py-3 text-sm font-semibold text-destructive disabled:opacity-50"
            >
              <XCircle className="h-5 w-5" />
              {submitting ? '...' : "Can't Make It"}
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">Powered by Harusi Smart 💍</p>
      </motion.div>
    </div>
  );
};

export default RsvpPage;
