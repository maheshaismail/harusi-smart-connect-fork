import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Eye, MessageCircle, Calendar, MapPin, Clock, Users, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { toast } from 'sonner';
import InvitationCardCanvas from '@/components/invitation/InvitationCardCanvas';

interface Guest {
  id: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'pending' | 'declined';
  rsvp_token: string;
}

interface InvitationData {
  coupleName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  personalNote: string;
}

interface InvitationManagerProps {
  guests: Guest[];
}

const InvitationManager = ({ guests }: InvitationManagerProps) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [invitation, setInvitation] = useState<InvitationData>({
    coupleName: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    personalNote: '',
  });

  const toggleGuest = (id: string) => {
    setSelectedGuests(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedGuests.length === guests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(guests.map(g => g.id));
    }
  };

  const buildWhatsAppMessage = (guest: Guest) => {
    const rsvpUrl = `${window.location.origin}/rsvp/${guest.rsvp_token}`;
    const lines = [
      `💍 *${t('youAreInvited')}* 💍`,
      '',
      `${t('joinUs')}`,
      '',
      `👫 *${invitation.coupleName}*`,
      '',
      `📅 ${t('eventDate')}: ${invitation.eventDate}`,
      `🕐 ${t('eventTime')}: ${invitation.eventTime}`,
      `📍 ${t('eventVenue')}: ${invitation.venue}`,
      '',
      invitation.personalNote ? `💌 ${invitation.personalNote}` : '',
      '',
      `Dear *${guest.name}*, ${t('rsvpMessage')}`,
      '',
      `✅ Confirm or decline here:`,
      rsvpUrl,
      '',
      `${t('withLove')} ❤️`,
      `${invitation.coupleName}`,
    ].filter(Boolean);
    return encodeURIComponent(lines.join('\n'));
  };

  const sendWhatsApp = (guest: Guest) => {
    if (!guest.phone) {
      toast.error(t('noPhoneNumber'));
      return;
    }
    const phone = guest.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '');
    const msg = buildWhatsAppMessage(guest);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const sendToSelected = () => {
    const targets = guests.filter(g => selectedGuests.includes(g.id) && g.phone);
    if (targets.length === 0) {
      toast.error(t('noPhoneNumber'));
      return;
    }
    // Open first one immediately, show toast for the rest
    sendWhatsApp(targets[0]);
    if (targets.length > 1) {
      toast.info(`Opening WhatsApp for ${targets[0].name}. Click again for the next guest.`);
    }
  };

  const isFormValid = invitation.coupleName && invitation.eventDate && invitation.venue;

  return (
    <div className="mt-6">
      {/* Section Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-xl border border-primary/30 bg-card p-4"
      >
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="font-display font-semibold">{t('manageInvitations')}</span>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4">
              {/* Invitation Form */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  {t('createInvitation')}
                </h3>
                <input
                  placeholder={t('coupleName')}
                  value={invitation.coupleName}
                  onChange={e => setInvitation({ ...invitation, coupleName: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('eventDate')}</label>
                    <input
                      type="date"
                      value={invitation.eventDate}
                      onChange={e => setInvitation({ ...invitation, eventDate: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t('eventTime')}</label>
                    <input
                      type="time"
                      value={invitation.eventTime}
                      onChange={e => setInvitation({ ...invitation, eventTime: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <input
                  placeholder={t('eventVenue')}
                  value={invitation.venue}
                  onChange={e => setInvitation({ ...invitation, venue: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  placeholder={t('invitationNote')}
                  value={invitation.personalNote}
                  onChange={e => setInvitation({ ...invitation, personalNote: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
                />

                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!isFormValid}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-gradient py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Eye className="h-4 w-4" /> {t('previewCard')}
                </button>
              </div>

              {/* Card Preview */}
              <AnimatePresence>
                {showPreview && isFormValid && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-6 text-center space-y-3 shadow-lg"
                  >
                    <div className="flex justify-center">
                      <Heart className="h-8 w-8 text-primary fill-primary/20" />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-primary font-medium">{t('youAreInvited')}</p>
                    <h2 className="text-xl font-display font-bold text-foreground">{invitation.coupleName}</h2>
                    <p className="text-sm text-muted-foreground italic">{t('joinUs')}</p>
                    <div className="flex flex-col items-center gap-2 text-sm text-foreground/80 pt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        {invitation.eventDate}
                      </span>
                      {invitation.eventTime && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          {invitation.eventTime}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {invitation.venue}
                      </span>
                    </div>
                    {invitation.personalNote && (
                      <p className="text-sm text-muted-foreground mt-2 px-4">💌 {invitation.personalNote}</p>
                    )}
                    <p className="text-xs text-muted-foreground pt-2">{t('rsvpMessage')}</p>
                    <p className="text-sm font-medium text-primary">{t('withLove')} ❤️</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Downloadable Card */}
              {showPreview && isFormValid && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    {t('shareableCard')}
                  </h3>
                  <InvitationCardCanvas
                    coupleName={invitation.coupleName}
                    eventDate={invitation.eventDate}
                    eventTime={invitation.eventTime}
                    venue={invitation.venue}
                    personalNote={invitation.personalNote}
                  />
                </div>
              )}
              {showPreview && isFormValid && (
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {t('sendViaWhatsApp')}
                    </h3>
                    <button
                      onClick={selectAll}
                      className="text-xs text-primary font-medium"
                    >
                      {selectedGuests.length === guests.length ? t('cancel') : t('viewAll')}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {guests.map(guest => (
                      <div
                        key={guest.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={selectedGuests.includes(guest.id)}
                            onChange={() => toggleGuest(guest.id)}
                            className="rounded border-border"
                          />
                          <div>
                            <p className="text-sm font-medium">{guest.name}</p>
                            <p className="text-xs text-muted-foreground">{guest.phone || t('noPhoneNumber')}</p>
                          </div>
                        </label>
                        <button
                          onClick={() => sendWhatsApp(guest)}
                          disabled={!guest.phone}
                          className="rounded-lg bg-green-600 p-2 text-white disabled:opacity-30"
                          title={t('sendViaWhatsApp')}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedGuests.length > 0 && (
                    <button
                      onClick={sendToSelected}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white"
                    >
                      <Send className="h-4 w-4" />
                      {t('sendToSelected')} ({selectedGuests.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvitationManager;
