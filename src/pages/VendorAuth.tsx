import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { categories, cities } from '@/data/sampleData';
import { motion } from 'framer-motion';

const VendorAuth = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('Dar es Salaam');
  const [description, setDescription] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        navigate('/vendor-dashboard', { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !category || !email || !password) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: language === 'sw' ? 'Jaza sehemu zote zinazohitajika' : 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);

    // Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError || !authData.user) {
      setLoading(false);
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: authError?.message || 'Registration failed', variant: 'destructive' });
      return;
    }

    // Insert vendor role
    await supabase.from('user_roles').insert({ user_id: authData.user.id, role: 'vendor' } as any);

    // Create vendor profile
    const { error: profileError } = await supabase.from('vendor_profiles').insert({
      user_id: authData.user.id,
      business_name: businessName,
      category,
      city,
      description,
      phone,
    } as any);

    setLoading(false);
    if (profileError) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: profileError.message, variant: 'destructive' });
    } else {
      toast({ title: language === 'sw' ? 'Karibu!' : 'Welcome!', description: language === 'sw' ? 'Akaunti yako imeundwa' : 'Your account has been created' });
      navigate('/vendor-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-20 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h1 className="text-2xl font-display font-bold text-center mb-1">
          {isLogin ? t('login') : t('register')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {language === 'sw' ? 'Akaunti ya Mtoa Huduma' : 'Vendor Account'}
        </p>

        {/* Toggle */}
        <div className="flex rounded-lg bg-muted p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${isLogin ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            {t('login')}
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${!isLogin ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            {t('register')}
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>{language === 'sw' ? 'Barua pepe' : 'Email'}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>{language === 'sw' ? 'Neno la siri' : 'Password'}</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
              {loading ? t('loading') : t('login')}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label>{language === 'sw' ? 'Jina kamili' : 'Full Name'} *</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label>{language === 'sw' ? 'Jina la Biashara' : 'Business Name'} *</Label>
              <Input value={businessName} onChange={e => setBusinessName(e.target.value)} required />
            </div>
            <div>
              <Label>{language === 'sw' ? 'Barua pepe' : 'Email'} *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>{language === 'sw' ? 'Neno la siri' : 'Password'} *</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label>{t('phone')}</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+255</span>
                <Input type="tel" className="rounded-l-none" placeholder="7XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{t('category')} *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder={language === 'sw' ? 'Chagua kategoria' : 'Select category'} /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.key} value={cat.key}>
                      {language === 'sw' ? cat.sw : cat.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'sw' ? 'Jiji' : 'City'}</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cities.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('description')}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
            </div>
            <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
              {loading ? t('loading') : t('register')}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default VendorAuth;
