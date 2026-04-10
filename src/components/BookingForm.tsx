import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';

interface BookingFormProps {
  vendorId: string;
  packageId?: string;
  triggerLabel: string;
}

const BookingForm = ({ vendorId, packageId, triggerLabel }: BookingFormProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_date: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.customer_phone) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: language === 'sw' ? 'Jaza jina na nambari ya simu' : 'Please fill name and phone', variant: 'destructive' });
      return;
    }
    setLoading(true);

    // Get current user id for tracking
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from('booking_requests').insert({
      vendor_id: vendorId,
      package_id: packageId || null,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      event_date: form.event_date || null,
      message: form.message,
      customer_id: session?.user?.id || null,
    } as any);
    setLoading(false);

    if (error) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: language === 'sw' ? 'Imetumwa!' : 'Sent!', description: language === 'sw' ? 'Ombi lako la nafasi limetumwa' : 'Your booking request has been sent' });
      setOpen(false);
      setForm({ customer_name: '', customer_phone: '', customer_email: '', event_date: '', message: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 rounded-lg bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground">
          {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {language === 'sw' ? 'Omba Nafasi' : 'Book Now'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>{language === 'sw' ? 'Jina lako' : 'Your Name'} *</Label>
            <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Nambari ya simu' : 'Phone'} *</Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+255</span>
              <Input type="tel" className="rounded-l-none" placeholder="7XXXXXXXX" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>{language === 'sw' ? 'Barua pepe' : 'Email'}</Label>
            <Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Tarehe ya tukio' : 'Event Date'}</Label>
            <Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
          </div>
          <div>
            <Label>{language === 'sw' ? 'Ujumbe' : 'Message'}</Label>
            <Textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder={language === 'sw' ? 'Eleza mahitaji yako...' : 'Describe your needs...'} />
          </div>
          <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
            {loading ? (language === 'sw' ? 'Inatuma...' : 'Sending...') : (language === 'sw' ? 'Tuma Ombi' : 'Send Request')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm;
