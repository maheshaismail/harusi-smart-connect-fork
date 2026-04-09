import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Calendar, User, LogOut, Image as ImageIcon, AlertCircle, MessageCircle } from 'lucide-react';
import VendorProfileTab from '@/components/vendor/VendorProfileTab';
import VendorGalleryTab from '@/components/vendor/VendorGalleryTab';
import VendorPackagesTab from '@/components/vendor/VendorPackagesTab';
import VendorBookingsTab from '@/components/vendor/VendorBookingsTab';

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
  approval_status: string;
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
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<VendorProfile>>({});

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    const { data: vp } = await supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle() as any;

    if (!vp) {
      setLoading(false);
      return;
    }

    setProfile(vp);
    setEditProfile(vp);

    const [pkgsRes, bksRes, galRes] = await Promise.all([
      supabase.from('vendor_packages').select('*').eq('vendor_id', vp.id) as any,
      supabase.from('booking_requests').select('*').eq('vendor_id', vp.id).order('created_at', { ascending: false }) as any,
      supabase.from('vendor_gallery').select('*').eq('vendor_id', vp.id).order('sort_order', { ascending: true }) as any,
    ]);

    setPackages(pkgsRes.data || []);
    setBookings(bksRes.data || []);
    setGallery(galRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user, loadData]);

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

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-semibold">
            {language === 'sw' ? 'Hakuna wasifu wa mtoa huduma' : 'No vendor profile found'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {language === 'sw' ? 'Tafadhali jisajili kama mtoa huduma kwanza' : 'Please register as a vendor first'}
          </p>
          <Button onClick={() => navigate('/auth', { replace: true })} variant="outline">
            {language === 'sw' ? 'Rudi' : 'Go Back'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-24 md:pb-8">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold">{t('vendorDashboard')}</h1>
            <p className="text-sm text-muted-foreground">{profile.business_name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Approval status banner */}
        {profile.approval_status === 'pending' && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 mb-4 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-300">
                {language === 'sw' ? 'Akaunti yako inasubiri kuidhinishwa' : 'Your account is pending approval'}
              </p>
              <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
                {language === 'sw'
                  ? 'Utaonekana kwa wateja baada ya msimamizi kukuidhinisha. Endelea kuandaa wasifu wako.'
                  : 'You will be visible to customers after admin approval. Meanwhile, set up your profile.'}
              </p>
            </div>
          </div>
        )}

        {profile.approval_status === 'rejected' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 mb-4 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">
                {language === 'sw' ? 'Akaunti yako imekataliwa' : 'Your account was rejected'}
              </p>
              <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                {language === 'sw'
                  ? 'Tafadhali wasiliana na msaada kwa maelezo zaidi.'
                  : 'Please contact support for more details.'}
              </p>
            </div>
          </div>
        )}

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{packages.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Vifurushi' : 'Packages'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{gallery.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Picha' : 'Photos'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-primary">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">{language === 'sw' ? 'Maombi' : 'Inquiries'}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings">
          <TabsList className="w-full">
            <TabsTrigger value="bookings" className="flex-1 relative">
              <Calendar className="h-4 w-4 mr-1" />
              {language === 'sw' ? 'Maombi' : 'Inquiries'}
              {pendingBookings > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingBookings}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">
              <User className="h-4 w-4 mr-1" />{t('profile')}
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex-1">
              <Package className="h-4 w-4 mr-1" />{language === 'sw' ? 'Vifurushi' : 'Packages'}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex-1">
              <ImageIcon className="h-4 w-4 mr-1" />{language === 'sw' ? 'Galari' : 'Gallery'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-4">
            <VendorBookingsTab bookings={bookings} setBookings={setBookings} />
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <VendorProfileTab
              profile={profile}
              editingProfile={editingProfile}
              editProfile={editProfile}
              setEditingProfile={setEditingProfile}
              setEditProfile={setEditProfile}
              onSave={handleUpdateProfile}
            />
          </TabsContent>

          <TabsContent value="packages" className="mt-4">
            <VendorPackagesTab vendorId={profile.id} packages={packages} setPackages={setPackages} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            <VendorGalleryTab vendorId={profile.id} gallery={gallery} setGallery={setGallery} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
