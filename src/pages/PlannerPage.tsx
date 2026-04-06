import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { cities, formatTZS } from '@/data/sampleData';
import { CalendarHeart, Users, MapPin, Wallet, Sparkles, Lightbulb, Clock, Star, Loader2, MessageCircle, Send, Calendar } from 'lucide-react';
import BookingForm from '@/components/BookingForm';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BudgetItem {
  category: string;
  amount: number;
  percentage: number;
  notes?: string;
}

interface TimelineItem {
  timeframe: string;
  tasks: string[];
}

interface VendorRec {
  name: string;
  priceRange: string;
  rating?: number;
  description: string;
  vendorId?: string;
}

interface VendorCategory {
  category: string;
  vendors: VendorRec[];
}

interface AIPlan {
  summary: string;
  budgetBreakdown: BudgetItem[];
  tips: string[];
  timeline: TimelineItem[];
  vendorRecommendations: VendorCategory[];
}

const PlannerPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState({
    date: '',
    budget: 5000000,
    guests: 200,
    location: 'Dar es Salaam',
  });
  const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'budget' | 'tips' | 'timeline' | 'vendors'>('budget');

  const handleSaveAndAnalyze = async () => {
    localStorage.setItem('harusi-plan', JSON.stringify(plan));
    setLoading(true);
    setAiPlan(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-plan', {
        body: {
          budget: plan.budget,
          guests: plan.guests,
          location: plan.location,
          date: plan.date,
          language,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiPlan(data as AIPlan);
    } catch (err: any) {
      console.error('AI plan error:', err);
      toast({
        title: t('aiError'),
        description: err.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'budget' as const, label: t('budgetBreakdownTitle'), icon: Wallet },
    { key: 'tips' as const, label: t('tipsTitle'), icon: Lightbulb },
    { key: 'timeline' as const, label: t('timelineTitle'), icon: Clock },
    { key: 'vendors' as const, label: t('vendorRecsTitle'), icon: Star },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container py-6 max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('weddingPlanner')}</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Date */}
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <CalendarHeart className="h-4 w-4 text-primary" />
              {t('weddingDate')}
            </label>
            <input
              type="date"
              value={plan.date}
              onChange={(e) => setPlan({ ...plan, date: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Budget */}
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              {t('estimatedBudget')}: {formatTZS(plan.budget)}
            </label>
            <input
              type="range"
              min={1000000}
              max={50000000}
              step={500000}
              value={plan.budget}
              onChange={(e) => setPlan({ ...plan, budget: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>TZS 1M</span>
              <span>TZS 50M</span>
            </div>
          </div>

          {/* Guests */}
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Users className="h-4 w-4 text-primary" />
              {t('guestCount')}: {plan.guests}
            </label>
            <input
              type="range"
              min={20}
              max={1000}
              step={10}
              value={plan.guests}
              onChange={(e) => setPlan({ ...plan, guests: parseInt(e.target.value) })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>20</span>
              <span>1,000</span>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-xl border border-border bg-card p-4">
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              {t('weddingLocation')}
            </label>
            <select
              value={plan.location}
              onChange={(e) => setPlan({ ...plan, location: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveAndAnalyze}
            disabled={loading}
            className="w-full rounded-xl bg-gold-gradient py-3 font-semibold text-primary-foreground shadow-gold transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('analyzingPlan')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {aiPlan ? t('regenerate') : t('generateAIPlan')}
              </>
            )}
          </button>
        </motion.div>

        {/* AI Plan Results */}
        <AnimatePresence>
          {aiPlan && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              {/* Summary */}
              <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6 shadow-gold">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-display font-bold">{t('aiPlanReady')}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{aiPlan.summary}</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.key
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Budget Breakdown */}
              {activeTab === 'budget' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {aiPlan.budgetBreakdown.map((item, i) => (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{item.category}</span>
                        <span className="font-bold text-sm text-primary">{formatTZS(item.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full bg-gold-gradient transition-all duration-700"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.percentage}%</span>
                        {item.notes && <span>{item.notes}</span>}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Tips */}
              {activeTab === 'tips' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-2"
                >
                  {aiPlan.tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Timeline */}
              {activeTab === 'timeline' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {aiPlan.timeline.map((phase, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">{phase.timeframe}</h3>
                      </div>
                      <ul className="space-y-1.5 ml-6">
                        {phase.tasks.map((task, j) => (
                          <li key={j} className="text-sm text-muted-foreground list-disc">{task}</li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Vendor Recommendations */}
              {activeTab === 'vendors' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  {aiPlan.vendorRecommendations.map((cat, i) => (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <h3 className="font-display font-semibold text-base mb-2">{cat.category}</h3>
                      <div className="space-y-2">
                        {cat.vendors.map((vendor, j) => (
                          <div
                            key={j}
                            className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-gold"
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-sm">{vendor.name}</h4>
                              {vendor.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                  <span className="text-xs font-semibold">{vendor.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{vendor.description}</p>
                            <p className="text-xs font-medium text-primary mb-3">
                              {t('priceRange')}: {vendor.priceRange}
                            </p>
                            <div className="flex gap-2">
                              {vendor.vendorId ? (
                                <BookingForm vendorId={vendor.vendorId} triggerLabel={t('bookNow')} />
                              ) : (
                                <button
                                  onClick={() => {
                                    toast({
                                      title: t('bookNow'),
                                      description: language === 'sw'
                                        ? `Wasiliana na ${vendor.name} moja kwa moja kupitia simu au barua pepe`
                                        : `Contact ${vendor.name} directly via phone or email to book`,
                                    });
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gold-gradient py-2 text-xs font-semibold text-primary-foreground"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                  {t('bookNow')}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (vendor.vendorId) {
                                    navigate(`/chat?vendor=${vendor.vendorId}`);
                                  } else {
                                    toast({
                                      title: t('chatNow'),
                                      description: language === 'sw'
                                        ? `Huduma ya mazungumzo itapatikana hivi karibuni kwa ${vendor.name}`
                                        : `Chat will be available soon for ${vendor.name}`,
                                    });
                                  }
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {t('chatNow')}
                              </button>
                              <button
                                onClick={() => {
                                  toast({
                                    title: t('requestQuote'),
                                    description: language === 'sw'
                                      ? `Ombi la bei limetumwa kwa ${vendor.name}`
                                      : `Quote request sent to ${vendor.name}`,
                                  });
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {t('requestQuote')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlannerPage;
