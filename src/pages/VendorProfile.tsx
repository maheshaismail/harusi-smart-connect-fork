import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { formatTZS } from '@/data/sampleData';
import { Star, MapPin, BadgeCheck, ArrowLeft, Loader2, Phone, MessageCircle, Camera, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingForm from '@/components/BookingForm';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface VendorData {
  id: string;
  business_name: string;
  category: string;
  city: string;
  description: string | null;
  description_sw: string | null;
  phone: string | null;
  price_from: number;
  verified: boolean;
  image_url: string | null;
}

interface PackageData {
  id: string;
  name: string;
  name_sw: string | null;
  price: number;
  description: string | null;
  description_sw: string | null;
  image_url: string | null;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  caption_sw: string | null;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const VendorProfile = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'packages' | 'gallery' | 'reviews'>('about');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Review form
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: v } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (v) {
        setVendor(v);
        const [pkgRes, galRes, revRes] = await Promise.all([
          supabase.from('vendor_packages').select('*').eq('vendor_id', v.id),
          supabase.from('vendor_gallery').select('*').eq('vendor_id', v.id).order('sort_order'),
          supabase.from('vendor_reviews').select('*').eq('vendor_id', v.id).order('created_at', { ascending: false }),
        ]);
        setPackages(pkgRes.data || []);
        setGallery(galRes.data || []);
        setReviews(revRes.data || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmitReview = async () => {
    if (!reviewForm.reviewer_name || !vendor) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('vendor_reviews').insert({
      vendor_id: vendor.id,
      reviewer_name: reviewForm.reviewer_name,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    });
    setSubmittingReview(false);
    if (error) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: language === 'sw' ? 'Asante!' : 'Thank you!', description: language === 'sw' ? 'Tathmini yako imetumwa' : 'Your review has been submitted' });
      // Refresh reviews
      const { data } = await supabase.from('vendor_reviews').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false });
      setReviews(data || []);
      setReviewForm({ reviewer_name: '', rating: 5, comment: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('noResults')}</p>
      </div>
    );
  }

  const heroImage = vendor.image_url || '/placeholder.svg';
  const tabs = [
    { key: 'about' as const, label: language === 'sw' ? 'Kuhusu' : 'About' },
    { key: 'packages' as const, label: t('myPackages') },
    { key: 'gallery' as const, label: language === 'sw' ? 'Picha' : 'Gallery' },
    { key: 'reviews' as const, label: `${language === 'sw' ? 'Tathmini' : 'Reviews'} (${reviews.length})` },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-8">
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={heroImage} alt={vendor.business_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <Link to="/vendors" className="absolute top-4 left-4 rounded-full bg-card/80 p-2 backdrop-blur-sm z-10">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {/* Hero overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-display font-bold text-white">{vendor.business_name}</h1>
            {vendor.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {vendor.city}</span>
            <span className="capitalize">{vendor.category}</span>
            {avgRating && (
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {avgRating}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-semibold text-primary">
            {language === 'sw' ? 'Kuanzia' : 'From'} {formatTZS(vendor.price_from)}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="container -mt-5 relative z-10">
        <div className="flex gap-2">
          <BookingForm vendorId={vendor.id} triggerLabel={t('bookNow')} />
          <Link
            to={`/chat?vendor=${vendor.id}`}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-card border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> {t('chatNow')}
          </Link>
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="flex items-center justify-center rounded-lg bg-card border border-border px-4 py-2.5 hover:bg-muted transition-colors"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container mt-5">
        <div className="flex gap-1 border-b border-border overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-5"
          >
            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-display font-bold text-lg mb-3">
                    {language === 'sw' ? 'Kuhusu' : 'About'}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language === 'sw' ? (vendor.description_sw || vendor.description) : vendor.description}
                  </p>
                </div>

                {/* Quick info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{packages.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('myPackages')}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{reviews.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{language === 'sw' ? 'Tathmini' : 'Reviews'}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{gallery.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{language === 'sw' ? 'Picha' : 'Photos'}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <p className="text-2xl font-bold text-primary">{avgRating || '-'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{language === 'sw' ? 'Kiwango' : 'Rating'}</p>
                  </div>
                </div>

                {/* Contact info */}
                {vendor.phone && (
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('phone')}</p>
                      <a href={`tel:${vendor.phone}`} className="text-sm font-medium text-foreground">{vendor.phone}</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Packages Tab */}
            {activeTab === 'packages' && (
              <div className="space-y-3">
                {packages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t('noResults')}</p>
                ) : packages.map((pkg, i) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {pkg.image_url && (
                      <img src={pkg.image_url} alt={pkg.name} className="w-full h-44 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{language === 'sw' ? (pkg.name_sw || pkg.name) : pkg.name}</h3>
                        <span className="font-bold text-primary">{formatTZS(pkg.price)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === 'sw' ? (pkg.description_sw || pkg.description) : pkg.description}
                      </p>
                      <div className="flex gap-2">
                        <BookingForm vendorId={vendor.id} packageId={pkg.id} triggerLabel={t('bookNow')} />
                        <Link
                          to={`/chat?vendor=${vendor.id}`}
                          className="flex-1 flex items-center justify-center rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                          {t('requestQuote')}
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div>
                {gallery.length === 0 ? (
                  <div className="text-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {language === 'sw' ? 'Hakuna picha bado' : 'No photos yet'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {gallery.map((img, i) => (
                      <motion.div
                        key={img.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => setLightboxIdx(i)}
                      >
                        <img
                          src={img.image_url}
                          alt={img.caption || ''}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-2">
                            <p className="text-xs text-white truncate">
                              {language === 'sw' ? (img.caption_sw || img.caption) : img.caption}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Lightbox */}
                {lightboxIdx !== null && (
                  <Dialog open={true} onOpenChange={() => setLightboxIdx(null)}>
                    <DialogContent className="max-w-3xl p-1 bg-black/95 border-none">
                      <img
                        src={gallery[lightboxIdx].image_url}
                        alt={gallery[lightboxIdx].caption || ''}
                        className="w-full h-auto max-h-[80vh] object-contain rounded"
                      />
                      {gallery[lightboxIdx].caption && (
                        <p className="text-center text-white/80 text-sm py-2">
                          {language === 'sw'
                            ? (gallery[lightboxIdx].caption_sw || gallery[lightboxIdx].caption)
                            : gallery[lightboxIdx].caption}
                        </p>
                      )}
                      <div className="flex justify-between px-4 pb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white"
                          disabled={lightboxIdx === 0}
                          onClick={() => setLightboxIdx(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
                        >
                          ← {language === 'sw' ? 'Nyuma' : 'Prev'}
                        </Button>
                        <span className="text-white/50 text-sm self-center">{lightboxIdx + 1} / {gallery.length}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white"
                          disabled={lightboxIdx === gallery.length - 1}
                          onClick={() => setLightboxIdx(prev => (prev !== null && prev < gallery.length - 1 ? prev + 1 : prev))}
                        >
                          {language === 'sw' ? 'Mbele' : 'Next'} →
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-5">
                {/* Submit review */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-semibold text-sm">
                    {language === 'sw' ? 'Acha Tathmini' : 'Leave a Review'}
                  </h3>
                  <Input
                    placeholder={language === 'sw' ? 'Jina lako' : 'Your name'}
                    value={reviewForm.reviewer_name}
                    onChange={e => setReviewForm(f => ({ ...f, reviewer_name: e.target.value }))}
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            n <= reviewForm.rating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={language === 'sw' ? 'Andika maoni yako...' : 'Write your comment...'}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    rows={3}
                  />
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!reviewForm.reviewer_name || submittingReview}
                    onClick={handleSubmitReview}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingReview
                      ? (language === 'sw' ? 'Inatuma...' : 'Sending...')
                      : (language === 'sw' ? 'Tuma Tathmini' : 'Submit Review')}
                  </Button>
                </div>

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">
                    {language === 'sw' ? 'Hakuna tathmini bado' : 'No reviews yet. Be the first!'}
                  </p>
                ) : reviews.map((rev, i) => (
                  <motion.div
                    key={rev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{rev.reviewer_name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            className={`h-3.5 w-3.5 ${si < rev.rating ? 'fill-primary text-primary' : 'text-muted-foreground/20'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && <p className="text-sm text-muted-foreground">{rev.comment}</p>}
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      {new Date(rev.created_at).toLocaleDateString(language === 'sw' ? 'sw-TZ' : 'en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VendorProfile;
