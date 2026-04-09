import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatTZS } from '@/data/sampleData';
import { Plus, Trash2, Pencil, X, Save } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { motion } from 'framer-motion';

interface VendorPackage {
  id: string;
  name: string;
  name_sw: string;
  price: number;
  description: string;
  description_sw: string;
  image_url: string;
}

interface Props {
  vendorId: string;
  packages: VendorPackage[];
  setPackages: (p: VendorPackage[]) => void;
}

const emptyPkg = { name: '', name_sw: '', price: 0, description: '', description_sw: '', image_url: '' };

const VendorPackagesTab = ({ vendorId, packages, setPackages }: Props) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [newPkg, setNewPkg] = useState(emptyPkg);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState(emptyPkg);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newPkg.name) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('vendor_packages')
      .insert({ vendor_id: vendorId, ...newPkg } as any)
      .select()
      .single() as any;
    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPackages([...packages, data]);
      setNewPkg(emptyPkg);
      setShowNew(false);
      toast({ title: language === 'sw' ? 'Kifurushi kimeongezwa!' : 'Package added!' });
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('vendor_packages')
      .update({
        name: editPkg.name,
        name_sw: editPkg.name_sw,
        price: editPkg.price,
        description: editPkg.description,
        description_sw: editPkg.description_sw,
        image_url: editPkg.image_url,
      } as any)
      .eq('id', id) as any;
    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setPackages(packages.map(p => p.id === id ? { ...p, ...editPkg } : p));
      setEditingId(null);
      toast({ title: language === 'sw' ? 'Kimehifadhiwa!' : 'Saved!' });
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('vendor_packages').delete().eq('id', id) as any;
    setPackages(packages.filter(p => p.id !== id));
    toast({ title: language === 'sw' ? 'Kimefutwa' : 'Deleted' });
  };

  const startEdit = (pkg: VendorPackage) => {
    setEditingId(pkg.id);
    setEditPkg({ name: pkg.name, name_sw: pkg.name_sw, price: pkg.price, description: pkg.description, description_sw: pkg.description_sw, image_url: pkg.image_url });
  };

  const renderForm = (values: typeof emptyPkg, onChange: (v: typeof emptyPkg) => void, onSave: () => void, onCancel: () => void) => (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div>
        <Label>{t('packageName')} (EN) *</Label>
        <Input value={values.name} onChange={e => onChange({ ...values, name: e.target.value })} />
      </div>
      <div>
        <Label>{t('packageName')} (SW)</Label>
        <Input value={values.name_sw} onChange={e => onChange({ ...values, name_sw: e.target.value })} />
      </div>
      <div>
        <Label>{t('packagePrice')} (TZS)</Label>
        <Input type="number" value={values.price} onChange={e => onChange({ ...values, price: parseInt(e.target.value) || 0 })} />
      </div>
      <div>
        <Label>{t('packageDescription')} (EN)</Label>
        <Textarea value={values.description} onChange={e => onChange({ ...values, description: e.target.value })} rows={2} />
      </div>
      <div>
        <Label>{t('packageDescription')} (SW)</Label>
        <Textarea value={values.description_sw} onChange={e => onChange({ ...values, description_sw: e.target.value })} rows={2} />
      </div>
      <div>
        <Label>{language === 'sw' ? 'Picha' : 'Photo'}</Label>
        <ImageUpload currentUrl={values.image_url} onUploaded={(url) => onChange({ ...values, image_url: url })} folder="packages" />
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving} className="bg-gold-gradient text-primary-foreground shadow-gold">
          <Save className="h-4 w-4 mr-1" /> {saving ? '...' : t('save')}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> {t('cancel')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {packages.length === 0 && !showNew && (
        <p className="text-center text-muted-foreground py-8">{language === 'sw' ? 'Hakuna vifurushi bado' : 'No packages yet'}</p>
      )}

      {packages.map(pkg => (
        <motion.div key={pkg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {editingId === pkg.id ? (
            renderForm(editPkg, setEditPkg, () => handleUpdate(pkg.id), () => setEditingId(null))
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
              {pkg.image_url && (
                <img src={pkg.image_url} alt={pkg.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{language === 'sw' ? pkg.name_sw || pkg.name : pkg.name}</h3>
                <p className="text-sm text-primary font-bold">{formatTZS(pkg.price)}</p>
                <p className="text-sm text-muted-foreground mt-1">{language === 'sw' ? pkg.description_sw || pkg.description : pkg.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(pkg)}>
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {showNew ? (
        renderForm(newPkg, setNewPkg, handleAdd, () => setShowNew(false))
      ) : (
        <Button onClick={() => setShowNew(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-1" /> {t('addPackage')}
        </Button>
      )}
    </div>
  );
};

export default VendorPackagesTab;
