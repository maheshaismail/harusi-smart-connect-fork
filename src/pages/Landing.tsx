import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BadgeCheck, Calculator, MessageCircle } from 'lucide-react';
import VendorCard from '@/components/VendorCard';
import Footer from '@/components/Footer';
import { sampleVendors } from '@/data/sampleData';

const Landing = () => {
  const { t, language } = useLanguage();
  const topVendors = sampleVendors.filter(v => v.verified).slice(0, 4);

  const features = [
    { icon: Sparkles, title: t('smartPlanning'), desc: t('smartPlanningDesc') },
    { icon: BadgeCheck, title: t('verifiedVendors'), desc: t('verifiedVendorsDesc') },
    { icon: Calculator, title: t('budgetTracker'), desc: t('budgetTrackerDesc') },
    { icon: MessageCircle, title: t('instantChat'), desc: t('instantChatDesc') },
  ];

  const stats = [
    { value: '2,500+', label: t('happyCouples') },
    { value: '350+', label: t('activeVendors') },
    { value: '6', label: t('citiesCovered') },
    { value: '98%', label: t('successRate') },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-hero-gradient text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(43 62% 52% / 0.3), transparent 50%), radial-gradient(circle at 80% 20%, hsl(43 70% 60% / 0.2), transparent 40%)' }} />
        </div>
        <div className="container relative py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight whitespace-pre-line">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 text-lg text-primary-foreground/80 max-w-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/planner"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-6 py-3 font-semibold text-primary-foreground shadow-gold transition-opacity hover:opacity-90"
              >
                {t('planWedding')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/vendors"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                {t('exploreVendors')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background">
        <div className="container py-16">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-10">
            {t('smartPlanning')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="rounded-xl border border-border bg-card p-6 text-center transition-shadow hover:shadow-gold"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-gradient">
                  <feat.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Vendors */}
      <section className="bg-muted/50">
        <div className="container py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold">{t('topRated')}</h2>
            <Link to="/vendors" className="text-sm font-medium text-primary hover:underline">
              {t('viewAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topVendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="bg-card border-y border-border">
        <div className="container py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient">
              <BadgeCheck className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
              {language === 'sw' ? 'Je, wewe ni Mtoa Huduma?' : 'Are you a Vendor?'}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {language === 'sw'
                ? 'Jiunge na Harusi Smart kufikia maelfu ya wanandoa wanaopanga harusi yao.'
                : 'Join Harusi Smart to reach thousands of couples planning their wedding.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/vendor-auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-8 py-3.5 font-semibold text-primary-foreground shadow-gold transition-opacity hover:opacity-90"
              >
                {language === 'sw' ? 'Jisajili kama Mtoa Huduma' : 'Register as Vendor'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/vendor-auth"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-8 py-3.5 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {language === 'sw' ? 'Ingia kwa Akaunti' : 'Vendor Login'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient text-primary-foreground">
        <div className="container py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">{t('getStarted')}</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">{t('heroSubtitle')}</p>
          <Link
            to="/planner"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-8 py-3.5 font-semibold text-primary-foreground shadow-gold transition-opacity hover:opacity-90"
          >
            {t('planWedding')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
