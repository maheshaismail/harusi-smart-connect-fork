import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Footer from '@/components/Footer';

interface Booking {
  id: string;
  vendor_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
  vendor_profiles?: { business_name: string; category: string; image_url: string | null } | null;
}

const MyBookingsPage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      const { data } = await supabase
        .from('booking_requests')
        .select('*, vendor_profiles(business_name, category, image_url)')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false }) as any;

      setBookings(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string; labelSw: string }> = {
    pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending', labelSw: 'Inasubiri' },
    accepted: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Accepted', labelSw: 'Imekubaliwa' },
    declined: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Declined', labelSw: 'Imekataliwa' },
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-display font-bold">
                {language === 'sw' ? 'Nafasi Zangu' : 'My Bookings'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'sw' ? `Maombi ${bookings.length}` : `${bookings.length} requests`}
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-yellow-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {pendingCount} {language === 'sw' ? 'inasubiri' : 'pending'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {language === 'sw' ? 'Huna maombi ya nafasi bado' : 'No booking requests yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((bk, i) => {
                const sc = statusConfig[bk.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                const vendor = bk.vendor_profiles;
                return (
                  <motion.div
                    key={bk.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      {vendor?.image_url ? (
                        <img src={vendor.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{vendor?.business_name || 'Vendor'}</h3>
                            <p className="text-xs text-muted-foreground capitalize">{vendor?.category}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {language === 'sw' ? sc.labelSw : sc.label}
                          </span>
                        </div>
                        {bk.event_date && (
                          <p className="text-xs mt-1">
                            <span className="text-muted-foreground">{language === 'sw' ? 'Tarehe' : 'Date'}:</span> {bk.event_date}
                          </p>
                        )}
                        {bk.message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bk.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(bk.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default MyBookingsPage;
