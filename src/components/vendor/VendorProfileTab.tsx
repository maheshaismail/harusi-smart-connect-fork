import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { formatTZS } from '@/data/sampleData';
import ImageUpload from '@/components/ImageUpload';

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

interface Props {
  profile: VendorProfile;
  editingProfile: boolean;
  editProfile: Partial<VendorProfile>;
  setEditingProfile: (v: boolean) => void;
  setEditProfile: (v: Partial<VendorProfile>) => void;
  onSave: () => void;
}

const VendorProfileTab = ({ profile, editingProfile, editProfile, setEditingProfile, setEditProfile, onSave }: Props) => {
  const { t, language } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card p-5 space-y-4">
      {editingProfile ? (
        <>
          <div>
            <Label>{language === 'sw' ? 'Picha ya Biashara' : 'Business Photo'}</Label>
            <ImageUpload currentUrl={editProfile.image_url || ''} onUploaded={(url) => setEditProfile({ ...editProfile, image_url: url })} folder="profile" />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Jina la Biashara' : 'Business Name'}</Label>
            <Input value={editProfile.business_name || ''} onChange={e => setEditProfile({ ...editProfile, business_name: e.target.value })} />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Maelezo (EN)' : 'Description (EN)'}</Label>
            <Textarea value={editProfile.description || ''} onChange={e => setEditProfile({ ...editProfile, description: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Maelezo (SW)' : 'Description (SW)'}</Label>
            <Textarea value={editProfile.description_sw || ''} onChange={e => setEditProfile({ ...editProfile, description_sw: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>{t('phone')}</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+255</span>
              <Input type="tel" className="rounded-l-none" placeholder="7XXXXXXXX" value={editProfile.phone || ''} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>{language === 'sw' ? 'Bei ya kuanzia (TZS)' : 'Starting price (TZS)'}</Label>
            <Input type="number" value={editProfile.price_from || 0} onChange={e => setEditProfile({ ...editProfile, price_from: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave} className="bg-gold-gradient text-primary-foreground shadow-gold">{t('save')}</Button>
            <Button variant="outline" onClick={() => setEditingProfile(false)}>{t('cancel')}</Button>
          </div>
        </>
      ) : (
        <>
          {profile?.image_url && (
            <img src={profile.image_url} alt={profile.business_name} className="w-full h-40 object-cover rounded-xl mb-3" />
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{profile?.business_name}</h2>
            {profile?.verified && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('verified')}</span>}
          </div>
          <p className="text-sm text-muted-foreground">{profile?.category} • {profile?.city}</p>
          <p className="text-sm">{language === 'sw' ? profile?.description_sw || profile?.description : profile?.description}</p>
          <p className="text-sm"><strong>{t('phone')}:</strong> {profile?.phone || '—'}</p>
          <p className="text-sm"><strong>{language === 'sw' ? 'Bei ya kuanzia' : 'Starting from'}:</strong> {formatTZS(profile?.price_from || 0)}</p>
          <Button variant="outline" onClick={() => setEditingProfile(true)}>{t('edit')}</Button>
        </>
      )}
    </motion.div>
  );
};

export default VendorProfileTab;
