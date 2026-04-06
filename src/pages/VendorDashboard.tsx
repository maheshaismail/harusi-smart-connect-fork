import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatTZS } from '@/data/sampleData';
import { motion } from 'framer-motion';
import { Package, Calendar, User, LogOut, Plus, Trash2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import VendorProfileTab from '@/components/vendor/VendorProfileTab';
import VendorGalleryTab from '@/components/vendor/VendorGalleryTab';

interface VendorProfile {
  id: string;
  business_name: string;
  category: string;
  city: string;
  description: string;
  description_sw: string;
  phone: string;
  price_from: number;
  verified: boolean;
  image_url: string;
}

interface VendorPackage {
  id: string;
  name: string;
  name_sw: string;
  price: number;
  description: string;
  description_sw: string;
  image_url: string;
}

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

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  caption_sw: string | null;
  sort_order: number | null;
}

const VendorDashboard = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<VendorProfile>>({});

  const [showNewPkg, setShowNewPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', name_sw: '', price: 0, description: '', description_sw: '', image_url: '' });

  useEffect(() => {
    // Listen for auth state changes to persist login across navigation
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        loadData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        navigate('/vendor-auth');
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadData(session.user.id);
      } else {
        setLoading(false);
        navigate('/vendor-auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId: string) => {
    setLoading(true);
    const { data: vp } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as any;

    if (!vp) {
      setLoading(false);
      navigate('/vendor-auth');
      return;
    }

    setProfile(vp);
    setEditProfile(vp);

    // Load packages, bookings, gallery in parallel
    const [pkgsRes, bksRes, galRes] = await Promise.all([
      supabase.from('vendor_packages').select('*').eq('vendor_id', vp.id) as any,
      supabase.from('booking_requests').select('*').eq('vendor_id', vp.id).order('created_at', { ascending: false }) as any,
      supabase.from('vendor_gallery').select('*').eq('vendor_id', vp.id).order('sort_order', { ascending: true }) as any,
    ]);

    setPackages(pkgsRes.data || []);
    setBookings(bksRes.data || []);
    setGallery(galRes.data || []);
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;
    const { error } = await supabase
      .from('vendor_profiles')
      .update({
        business_name: editProfile.business_name,
        description: editProfile.description,
        description_sw: editProfile.description_sw,
        phone: editProfile.phone,
        price_from: editProfile.price_from,
        image_url: editProfile.image_url,
      } as any)
      .eq('id', profile.id) as any;

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: language === 'sw' ? 'Imehifadhiwa!' : 'Saved!' });
      setProfile({ ...profile, ...editProfile } as VendorProfile);
      setEditingProfile(false);
    }
  };

  const handleAddPackage = async () => {
    if (!profile || !newPkg.name) return;
    const { data, error } = await supabase
      .from('vendor_packages')
      .insert({ vendor_id: profile.id, ...newPkg } as any)
      .select()
      .single() as any;

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPackages([...packages, data]);
      setNewPkg({ name: '', name_sw: '', price: 0, description: '', description_sw: '', image_url: '' });
      setShowNewPkg(false);
      toast({ title: language === 'sw' ? 'Kifurushi kimeongezwa!' : 'Package added!' });
    }
  };

  const handleDeletePackage = async (pkgId: string) => {
    await supabase.from('vendor_packages').delete().eq('id', pkgId) as any;
    setPackages(packages.filter(p => p.id !== pkgId));
  };

  const handleBookingStatus = async (bookingId: string, status: string) => {
    await supabase.from('booking_requests').update({ status } as any).eq('id', bookingId) as any;
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">{t('loading')}</p></div>;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold">{t('vendorDashboard')}</h1>
            <p className="text-sm text-muted-foreground">{profile?.business_name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1"><User className="h-4 w-4 mr-1" />{t('profile')}</TabsTrigger>
            <TabsTrigger value="packages" className="flex-1"><Package className="h-4 w-4 mr-1" />{t('myPackages')}</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1"><ImageIcon className="h-4 w-4 mr-1" />{language === 'sw' ? 'Galari' : 'Gallery'}</TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 relative">
              <Calendar className="h-4 w-4 mr-1" />{t('myBookings')}
              {bookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {bookings.filter(b => b.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            {profile && (
              <VendorProfileTab
                profile={profile}
                editingProfile={editingProfile}
                editProfile={editProfile}
                setEditingProfile={setEditingProfile}
                setEditProfile={setEditProfile}
                onSave={handleUpdateProfile}
              />
            )}
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="mt-4 space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
                {pkg.image_url && (
                  <img src={pkg.image_url} alt={pkg.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{language === 'sw' ? pkg.name_sw || pkg.name : pkg.name}</h3>
                  <p className="text-sm text-primary font-bold">{formatTZS(pkg.price)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{language === 'sw' ? pkg.description_sw || pkg.description : pkg.description}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {showNewPkg ? (
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div>
                  <Label>{t('packageName')} (EN)</Label>
                  <Input value={newPkg.name} onChange={e => setNewPkg({ ...newPkg, name: e.target.value })} />
                </div>
                <div>
                  <Label>{t('packageName')} (SW)</Label>
                  <Input value={newPkg.name_sw} onChange={e => setNewPkg({ ...newPkg, name_sw: e.target.value })} />
                </div>
                <div>
                  <Label>{t('packagePrice')} (TZS)</Label>
                  <Input type="number" value={newPkg.price} onChange={e => setNewPkg({ ...newPkg, price: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>{t('packageDescription')} (EN)</Label>
                  <Textarea value={newPkg.description} onChange={e => setNewPkg({ ...newPkg, description: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label>{t('packageDescription')} (SW)</Label>
                  <Textarea value={newPkg.description_sw} onChange={e => setNewPkg({ ...newPkg, description_sw: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label>{language === 'sw' ? 'Picha ya Kifurushi' : 'Package Photo'}</Label>
                  <ImageUpload currentUrl={newPkg.image_url} onUploaded={(url) => setNewPkg({ ...newPkg, image_url: url })} folder="packages" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddPackage} className="bg-gold-gradient text-primary-foreground shadow-gold">{t('save')}</Button>
                  <Button variant="outline" onClick={() => setShowNewPkg(false)}>{t('cancel')}</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowNewPkg(true)} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> {t('addPackage')}
              </Button>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-4">
            {profile && (
              <VendorGalleryTab
                vendorId={profile.id}
                gallery={gallery}
                setGallery={setGallery}
              />
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-4 space-y-3">
            {bookings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t('noResults')}</p>
            )}
            {bookings.map(bk => (
              <div key={bk.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{bk.customer_name}</h3>
                    <p className="text-xs text-muted-foreground">{bk.customer_email} • {bk.customer_phone}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    bk.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    bk.status === 'declined' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {bk.status === 'accepted' ? (language === 'sw' ? 'Imekubaliwa' : 'Accepted') :
                     bk.status === 'declined' ? (language === 'sw' ? 'Imekataliwa' : 'Declined') :
                     (language === 'sw' ? 'Inasubiri' : 'Pending')}
                  </span>
                </div>
                {bk.event_date && <p className="text-sm"><strong>{language === 'sw' ? 'Tarehe' : 'Date'}:</strong> {bk.event_date}</p>}
                {bk.message && <p className="text-sm text-muted-foreground mt-1">{bk.message}</p>}
                {bk.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => handleBookingStatus(bk.id, 'accepted')} className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> {language === 'sw' ? 'Kubali' : 'Accept'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBookingStatus(bk.id, 'declined')}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> {language === 'sw' ? 'Kataa' : 'Decline'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
