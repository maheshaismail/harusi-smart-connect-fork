import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { CalendarHeart, Users, Calculator, MessageCircle, Heart, Sparkles, LogOut, Calendar, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const CustomerDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [pendingBookings, setPendingBookings] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '';
      setUserName(name);

      // Load counts in parallel
      const [bookingsRes, convRes] = await Promise.all([
        supabase.from('booking_requests').select('id', { count: 'exact', head: true }).eq('customer_id', session.user.id).eq('status', 'pending') as any,
        supabase.from('chat_conversations').select('id', { count: 'exact', head: true }).eq('customer_id', session.user.id) as any,
      ]);
      setPendingBookings(bookingsRes.count || 0);
      setUnreadMessages(convRes.count || 0);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const quickLinks = [
    { path: '/planner', icon: Sparkles, label: t('planner'), desc: language === 'sw' ? 'Panga harusi yako na AI' : 'AI-powered wedding planning', badge: 0 },
    { path: '/my-bookings', icon: Calendar, label: language === 'sw' ? 'Nafasi Zangu' : 'My Bookings', desc: language === 'sw' ? 'Fuatilia maombi yako' : 'Track your booking requests', badge: pendingBookings },
    { path: '/vendors', icon: Users, label: t('vendors'), desc: language === 'sw' ? 'Tafuta watoa huduma' : 'Find verified vendors', badge: 0 },
    { path: '/budget', icon: Calculator, label: t('budget'), desc: language === 'sw' ? 'Fuatilia bajeti yako' : 'Track your budget', badge: 0 },
    { path: '/guests', icon: CalendarHeart, label: t('guests'), desc: language === 'sw' ? 'Simamia orodha ya wageni' : 'Manage guest list', badge: 0 },
    { path: '/chat', icon: MessageCircle, label: t('chat'), desc: language === 'sw' ? 'Ongea na watoa huduma' : 'Chat with vendors', badge: unreadMessages },
    { path: '/favorites', icon: Heart, label: t('favorites'), desc: language === 'sw' ? 'Watoa huduma unaowapenda' : 'Your saved vendors', badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pt-14">
      {/* Hero greeting */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="container py-8 md:py-12">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-primary-foreground/70 text-sm">
                {language === 'sw' ? 'Karibu tena' : 'Welcome back'},
              </p>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{userName} 👋</h1>
              <p className="text-primary-foreground/70 text-sm mt-1">
                {language === 'sw' ? 'Endelea kupanga harusi yako ya ndoto' : "Let's continue planning your dream wedding"}
              </p>
            </motion.div>
            <div className="flex items-center gap-2">
              {pendingBookings > 0 && (
                <Link to="/my-bookings" className="relative p-2 text-primary-foreground hover:bg-primary-foreground/10 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {pendingBookings}
                  </span>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick links grid */}
      <div className="container py-8 pb-24 md:pb-8">
        <h2 className="text-lg font-display font-bold mb-4">
          {language === 'sw' ? 'Huduma za Haraka' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to={link.path}
                className="relative flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center transition-shadow hover:shadow-gold group"
              >
                {link.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {link.badge}
                  </span>
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient transition-transform group-hover:scale-110">
                  <link.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{link.label}</h3>
                <p className="text-xs text-muted-foreground">{link.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerDashboard;
