import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Image as ImageIcon, Pencil, Save, X } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import { motion } from 'framer-motion';

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  caption_sw: string | null;
  sort_order: number | null;
}

interface Props {
  vendorId: string;
  gallery: GalleryImage[];
  setGallery: (g: GalleryImage[]) => void;
}

const VendorGalleryTab = ({ vendorId, gallery, setGallery }: Props) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newImage, setNewImage] = useState({ image_url: '', caption: '', caption_sw: '' });
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState({ caption: '', caption_sw: '' });

  const handleAdd = async () => {
    if (!newImage.image_url) {
      toast({ title: language === 'sw' ? 'Tafadhali pakia picha' : 'Please upload an image', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const { data, error } = await supabase
      .from('vendor_gallery')
      .insert({
        vendor_id: vendorId,
        image_url: newImage.image_url,
        caption: newImage.caption || null,
        caption_sw: newImage.caption_sw || null,
        sort_order: gallery.length,
      })
      .select()
      .single();

    setUploading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setGallery([...gallery, data as GalleryImage]);
      setNewImage({ image_url: '', caption: '', caption_sw: '' });
      setShowAdd(false);
      toast({ title: language === 'sw' ? 'Picha imeongezwa!' : 'Photo added!' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vendor_gallery').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setGallery(gallery.filter(g => g.id !== id));
      toast({ title: language === 'sw' ? 'Picha imefutwa' : 'Photo removed' });
    }
  };

  return (
    <div className="space-y-3">
      {gallery.length === 0 && !showAdd && (
        <p className="text-center text-muted-foreground py-8">
          {language === 'sw' ? 'Hakuna picha za galari bado' : 'No gallery photos yet'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {gallery.map((img, i) => (
          <motion.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative group rounded-xl overflow-hidden border border-border"
          >
            <img src={img.image_url} alt={img.caption || ''} className="w-full h-32 object-cover" />
            {(img.caption || img.caption_sw) && (
              <p className="text-xs text-muted-foreground p-2 truncate">
                {language === 'sw' ? img.caption_sw || img.caption : img.caption}
              </p>
            )}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(img.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ))}
      </div>

      {showAdd ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <Label>{language === 'sw' ? 'Picha' : 'Photo'}</Label>
            <ImageUpload
              currentUrl={newImage.image_url}
              onUploaded={(url) => setNewImage({ ...newImage, image_url: url })}
              folder="gallery"
            />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Maelezo (EN)' : 'Caption (EN)'}</Label>
            <Input value={newImage.caption} onChange={e => setNewImage({ ...newImage, caption: e.target.value })} placeholder={language === 'sw' ? 'Hiari' : 'Optional'} />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Maelezo (SW)' : 'Caption (SW)'}</Label>
            <Input value={newImage.caption_sw} onChange={e => setNewImage({ ...newImage, caption_sw: e.target.value })} placeholder={language === 'sw' ? 'Hiari' : 'Optional'} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={uploading} className="bg-gold-gradient text-primary-foreground shadow-gold">
              {uploading ? (language === 'sw' ? 'Inapakia...' : 'Saving...') : (language === 'sw' ? 'Hifadhi' : 'Save')}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {language === 'sw' ? 'Ghairi' : 'Cancel'}
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowAdd(true)} className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          <ImageIcon className="h-4 w-4 mr-1" />
          {language === 'sw' ? 'Ongeza Picha' : 'Add Photo'}
        </Button>
      )}
    </div>
  );
};

export default VendorGalleryTab;
