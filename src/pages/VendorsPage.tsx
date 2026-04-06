import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { categories, cities, formatTZS, Vendor } from '@/data/sampleData';
import { sampleVendors } from '@/data/sampleData';
import VendorCard from '@/components/VendorCard';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const VendorsPage = () => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      const { data: dbVendors, error } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, category, city, description, description_sw, image_url, phone, price_from, verified');

      if (error) {
        console.error('Error fetching vendors:', error);
        // Fallback to sample data
        setVendors(sampleVendors);
        setLoading(false);
        return;
      }

      // Fetch review stats for each vendor
      const { data: reviews } = await supabase
        .from('vendor_reviews')
        .select('vendor_id, rating');

      const reviewMap = new Map<string, { total: number; count: number }>();
      if (reviews) {
        for (const r of reviews) {
          const existing = reviewMap.get(r.vendor_id) || { total: 0, count: 0 };
          existing.total += r.rating;
          existing.count += 1;
          reviewMap.set(r.vendor_id, existing);
        }
      }

      const mapped: Vendor[] = (dbVendors || []).map((v) => {
        const stats = reviewMap.get(v.id);
        return {
          id: v.id,
          name: v.business_name,
          category: v.category,
          location: v.city,
          rating: stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
          reviewCount: stats?.count || 0,
          priceFrom: v.price_from,
          verified: v.verified,
          image: v.image_url || '/placeholder.svg',
          description: v.description || '',
          descriptionSw: v.description_sw || '',
          packages: [],
        };
      });

      // Merge: real vendors first, then sample data as fallback if no real vendors
      if (mapped.length > 0) {
        setVendors(mapped);
      } else {
        setVendors(sampleVendors);
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  const filtered = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || v.category === selectedCategory;
      const matchLoc = selectedLocation === 'all' || v.location === selectedLocation;
      return matchSearch && matchCat && matchLoc;
    });
  }, [search, selectedCategory, selectedLocation, vendors]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container py-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">{t('vendors')}</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchVendors')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t('allCategories')}</option>
            {categories.map(cat => (
              <option key={cat.key} value={cat.key}>{language === 'sw' ? cat.sw : cat.en}</option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">{t('allLocations')}</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">{t('noResults')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorsPage;
