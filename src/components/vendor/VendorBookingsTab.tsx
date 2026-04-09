import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookingRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string | null;
  message: string;
  status: string;
  created_at: string;
  package_id: string | null;
}

interface Props {
  bookings: BookingRequest[];
  setBookings: (b: BookingRequest[]) => void;
}

const VendorBookingsTab = ({ bookings, setBookings }: Props) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('booking_requests')
      .update({ status } as any)
      .eq('id', id) as any;

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      toast({
        title: status === 'accepted'
          ? (language === 'sw' ? 'Imekubaliwa!' : 'Accepted!')
          : (language === 'sw' ? 'Imekataliwa' : 'Declined'),
      });
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const sortedBookings = [...bookings].sort((a, b) => {
    const order = { pending: 0, accepted: 1, declined: 2 };
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
  });

  const statusBadge = (status: string) => {
    const styles = {
      accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    const labels = {
      accepted: language === 'sw' ? 'Imekubaliwa' : 'Accepted',
      declined: language === 'sw' ? 'Imekataliwa' : 'Declined',
      pending: language === 'sw' ? 'Inasubiri' : 'Pending',
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {pendingCount > 0 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm">
          <strong>{pendingCount}</strong> {language === 'sw' ? 'maombi yanasubiri jibu lako' : 'inquiry(s) awaiting your response'}
        </div>
      )}

      {sortedBookings.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          {language === 'sw' ? 'Hakuna maombi bado' : 'No inquiries yet'}
        </p>
      )}

      {sortedBookings.map((bk, i) => (
        <motion.div
          key={bk.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold">{bk.customer_name}</h3>
              <p className="text-xs text-muted-foreground">
                {bk.customer_email}{bk.customer_phone ? ` • ${bk.customer_phone}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(bk.created_at).toLocaleDateString()}
              </p>
            </div>
            {statusBadge(bk.status)}
          </div>

          {bk.event_date && (
            <p className="text-sm mb-1">
              <strong>{language === 'sw' ? 'Tarehe ya Tukio' : 'Event Date'}:</strong> {bk.event_date}
            </p>
          )}

          {bk.message && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {language === 'sw' ? 'Ujumbe' : 'Message'}:
              </p>
              {bk.message}
            </div>
          )}

          {bk.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => handleStatus(bk.id, 'accepted')} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> {language === 'sw' ? 'Kubali' : 'Accept'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleStatus(bk.id, 'declined')}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> {language === 'sw' ? 'Kataa' : 'Decline'}
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default VendorBookingsTab;
