import { Vendor, formatTZS } from '@/data/sampleData';
import { useLanguage } from '@/i18n/LanguageContext';
import { Star, MapPin, BadgeCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface VendorCardProps {
  vendor: Vendor;
  index?: number;
}

const VendorCard = ({ vendor, index = 0 }: VendorCardProps) => {
  const { t, language } = useLanguage();
  const [isFav, setIsFav] = useState(() => {
    const favs = JSON.parse(localStorage.getItem('harusi-favorites') || '[]');
    return favs.includes(vendor.id);
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favs = JSON.parse(localStorage.getItem('harusi-favorites') || '[]');
    const updated = isFav ? favs.filter((id: string) => id !== vendor.id) : [...favs, vendor.id];
    localStorage.setItem('harusi-favorites', JSON.stringify(updated));
    setIsFav(!isFav);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/vendor/${vendor.id}`} className="block group">
        <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-gold hover:border-primary/30">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={vendor.image}
              alt={vendor.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            {vendor.verified && (
              <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                <BadgeCheck className="h-3.5 w-3.5" />
                {t('verified')}
              </span>
            )}
            <button
              onClick={toggleFavorite}
              className="absolute top-3 right-3 rounded-full bg-card/80 p-2 backdrop-blur-sm transition-colors hover:bg-card"
            >
              <Heart className={`h-4 w-4 ${isFav ? 'fill-primary text-primary' : 'text-foreground'}`} />
            </button>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-lg font-display font-semibold text-primary-foreground">{vendor.name}</h3>
              <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {vendor.location}
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {language === 'sw' ? vendor.descriptionSw : vendor.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold">{vendor.rating}</span>
                <span className="text-xs text-muted-foreground">({vendor.reviewCount} {t('reviews')})</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('startingFrom')}</p>
                <p className="text-sm font-bold text-primary">{formatTZS(vendor.priceFrom)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default VendorCard;
