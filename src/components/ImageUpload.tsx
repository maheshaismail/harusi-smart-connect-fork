import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  folder: string; // e.g. "profile" or "packages"
  className?: string;
  rounded?: boolean;
}

const ImageUpload = ({ currentUrl, onUploaded, folder, className, rounded }: ImageUploadProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: language === 'sw' ? 'Tafadhali chagua picha' : 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: language === 'sw' ? 'Picha ni kubwa sana (max 5MB)' : 'Image too large (max 5MB)', variant: 'destructive' });
      return;
    }

    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('vendor-images')
      .upload(fileName, file, { upsert: true });

    if (error) {
      setUploading(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('vendor-images')
      .getPublicUrl(fileName);

    setPreview(urlData.publicUrl);
    onUploaded(urlData.publicUrl);
    setUploading(false);
    toast({ title: language === 'sw' ? 'Picha imepakiwa!' : 'Image uploaded!' });
  };

  const handleRemove = () => {
    setPreview('');
    onUploaded('');
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {preview ? (
        <div className={cn('relative group overflow-hidden border border-border', rounded ? 'rounded-full' : 'rounded-xl')}>
          <img
            src={preview}
            alt="Upload"
            className={cn('object-cover w-full', rounded ? 'h-full aspect-square' : 'h-40')}
          />
          <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-card/90 p-2 text-foreground"
              disabled={uploading}
            >
              <Camera className="h-4 w-4" />
            </button>
            <button
              onClick={handleRemove}
              className="rounded-full bg-card/90 p-2 text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors w-full',
            rounded ? 'rounded-full aspect-square' : 'rounded-xl h-40'
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-xs">{language === 'sw' ? 'Pakia Picha' : 'Upload Photo'}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
