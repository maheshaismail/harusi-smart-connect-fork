import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { sampleVendors } from '@/data/sampleData';
import VendorCard from '@/components/VendorCard';

const FavoritesPage = () => {
  const { t } = useLanguage();
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    const loadFavs = () => {
      const favs = JSON.parse(localStorage.getItem('harusi-favorites') || '[]');
      setFavIds(favs);
    };
    loadFavs();
    window.addEventListener('storage', loadFavs);
    // Poll for changes since localStorage events don't fire in same tab
    const interval = setInterval(loadFavs, 1000);
    return () => { window.removeEventListener('storage', loadFavs); clearInterval(interval); };
  }, []);

  const favVendors = sampleVendors.filter(v => favIds.includes(v.id));

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container py-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('favorites')}</h1>
        {favVendors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favVendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
