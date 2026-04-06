import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, UserCheck, Clock, UserX, Loader2, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InvitationManager from '@/components/InvitationManager';

interface Guest {
  id: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'declined';
  rsvp_token: string;
}

const GuestsPage = () => {
  const { t } = useLanguage();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', phone: '' });

  const loadGuests = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true });
    if (data) setGuests(data as Guest[]);
    setLoading(false);
  };

  useEffect(() => { loadGuests(); }, []);

  // Subscribe to realtime changes for RSVP updates
  useEffect(() => {
    const channel = supabase
      .channel('guests-rsvp')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'guests' }, (payload) => {
        setGuests(prev => prev.map(g => g.id === payload.new.id ? { ...g, ...payload.new } as Guest : g));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const confirmed = guests.filter(g => g.status === 'confirmed').length;
  const pending = guests.filter(g => g.status === 'pending').length;
  const declined = guests.filter(g => g.status === 'declined').length;

  const addGuest = async () => {
    if (!newGuest.name) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from('guests').insert({
      user_id: session.user.id,
      name: newGuest.name,
      phone: newGuest.phone,
    });
    if (!error) {
      setNewGuest({ name: '', phone: '' });
      loadGuests();
      toast.success(t('guestName') + ' ' + t('save'));
    } else {
      toast.error('Failed to add guest');
    }
  };

  const toggleStatus = async (guest: Guest) => {
    const next = guest.status === 'pending' ? 'confirmed' : guest.status === 'confirmed' ? 'declined' : 'pending';
    await supabase.from('guests').update({ status: next }).eq('id', guest.id);
    setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, status: next as Guest['status'] } : g));
  };

  const removeGuest = async (id: string) => {
    await supabase.from('guests').delete().eq('id', id);
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  const copyRsvpLink = (token: string) => {
    const url = `${window.location.origin}/rsvp/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('RSVP link copied!');
  };

  const statusIcon = (status: string) => {
    if (status === 'confirmed') return <UserCheck className="h-4 w-4 text-green-600" />;
    if (status === 'declined') return <UserX className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-primary" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container py-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('guestList')}</h1>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-green-600">{confirmed}</p>
            <p className="text-xs text-muted-foreground">{t('confirmed')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-primary">{pending}</p>
            <p className="text-xs text-muted-foreground">{t('pending')}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-lg font-bold text-destructive">{declined}</p>
            <p className="text-xs text-muted-foreground">{t('declined')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{t('totalGuests')}: {guests.length}</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 rounded-lg bg-gold-gradient px-3 py-2 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> {t('addGuest')}
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl border border-primary/30 bg-card p-4 mb-4 space-y-3"
          >
            <input
              placeholder={t('guestName')}
              value={newGuest.name}
              onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              placeholder={t('phone')}
              value={newGuest.phone}
              onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={addGuest} className="flex-1 rounded-lg bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground">{t('save')}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border py-2 text-sm font-medium">{t('cancel')}</button>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {guests.map((guest, i) => (
            <motion.div
              key={guest.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <button onClick={() => toggleStatus(guest)}>{statusIcon(guest.status)}</button>
                <div>
                  <p className="font-medium text-sm">{guest.name}</p>
                  <p className="text-xs text-muted-foreground">{guest.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyRsvpLink(guest.rsvp_token)}
                  className="text-muted-foreground hover:text-primary"
                  title="Copy RSVP link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeGuest(guest.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Invitation Manager */}
        <InvitationManager guests={guests} />
      </div>
    </div>
  );
};

export default GuestsPage;
