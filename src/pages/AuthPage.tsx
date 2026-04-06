import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { categories, cities } from '@/data/sampleData';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageToggle from '@/components/LanguageToggle';
import { toast as sonnerToast } from 'sonner';

type AccountType = 'customer' | 'vendor';
type AuthMode = 'login' | 'register' | 'forgot';

const AuthPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [loading, setLoading] = useState(false);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Vendor-only fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('Dar es Salaam');
  const [description, setDescription] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.debug('[Auth] Login attempt start');
    const loginStart = performance.now();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      console.debug('[Auth] Login API done in', Math.round(performance.now() - loginStart), 'ms');

      // Fetch role in background to decide redirect target, but don't block on it
      // Navigate immediately — role query is best-effort for redirect
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        const roles = roleData?.map(r => r.role) || [];
        console.debug('[Auth] Role check done in', Math.round(performance.now() - loginStart), 'ms');
        if (roles.includes('vendor')) {
          navigate('/vendor-dashboard', { replace: true });
          return;
        }
      } catch {
        // Role fetch failed — default to customer dashboard
        console.warn('[Auth] Role fetch failed, defaulting to customer dashboard');
      }

      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('[Auth] Login error:', err);
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: err?.message || 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: t('fillRequired'), variant: 'destructive' });
      return;
    }
    if (accountType === 'vendor' && (!businessName || !category)) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: t('fillRequired'), variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authError || !authData.user) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: authError?.message || 'Registration failed', variant: 'destructive' });
        return;
      }

      // Insert role — fire and forget for speed
      supabase.from('user_roles').insert({ user_id: authData.user.id, role: accountType } as any).then(() => {});

      if (accountType === 'vendor') {
        supabase.from('vendor_profiles').insert({
          user_id: authData.user.id,
          business_name: businessName,
          category,
          city,
          description,
          phone,
        } as any).then(() => {});
      }

      if (phone) {
        supabase.from('profiles').update({ phone } as any).eq('id', authData.user.id).then(() => {});
      }

      toast({ title: t('welcome'), description: t('accountCreated') });

      if (accountType === 'vendor') {
        navigate('/vendor-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: err?.message || 'Registration failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        sonnerToast.success(
          language === 'sw'
            ? 'Angalia barua pepe yako kwa kiungo cha kubadilisha neno la siri'
            : 'Check your email for a password reset link'
        );
        setAuthMode('login');
      }
    } catch (err: any) {
      toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: err?.message || 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-primary-foreground">Harusi Smart</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">
            {language === 'sw' ? 'Panga Harusi Yako ya Ndoto' : 'Plan Your Dream Wedding'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          {/* Auth mode toggle */}
          {authMode !== 'forgot' && (
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                {t('login')}
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${authMode === 'register' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                {t('register')}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {authMode === 'forgot' ? (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleForgotPassword}
                className="space-y-4"
              >
                <div className="text-center mb-2">
                  <h2 className="text-lg font-display font-semibold">
                    {language === 'sw' ? 'Umesahau Neno la Siri?' : 'Forgot Password?'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'sw'
                      ? 'Weka barua pepe yako kupata kiungo cha kubadilisha'
                      : 'Enter your email to receive a reset link'}
                  </p>
                </div>
                <div>
                  <Label>{t('email')}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
                  {loading
                    ? (language === 'sw' ? 'Inatuma...' : 'Sending...')
                    : (language === 'sw' ? 'Tuma Kiungo' : 'Send Reset Link')}
                </Button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="w-full text-sm text-primary hover:underline"
                >
                  {language === 'sw' ? '← Rudi Kuingia' : '← Back to Login'}
                </button>
              </motion.form>
            ) : authMode === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <Label>{t('email')}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>{t('password')}</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    {language === 'sw' ? 'Umesahau neno la siri?' : 'Forgot password?'}
                  </button>
                </div>
                <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
                  {loading ? t('loading') : t('login')}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                {/* Account type selector */}
                <div>
                  <Label>{language === 'sw' ? 'Aina ya Akaunti' : 'Account Type'}</Label>
                  <div className="flex rounded-lg bg-muted p-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setAccountType('customer')}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${accountType === 'customer' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                      {language === 'sw' ? '💍 Mteja' : '💍 Customer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType('vendor')}
                      className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${accountType === 'vendor' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                    >
                      {language === 'sw' ? '🏪 Mtoa Huduma' : '🏪 Vendor'}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>{t('fullName')} *</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label>{t('email')} *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label>{t('password')} *</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                </div>
                <div>
                  <Label>{t('phone')}</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>

                {accountType === 'vendor' && (
                  <>
                    <div>
                      <Label>{t('businessName')} *</Label>
                      <Input value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                    </div>
                    <div>
                      <Label>{t('category')} *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder={t('selectCategory')} /></SelectTrigger>
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
                      <Label>{t('city')}</Label>
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
                  </>
                )}

                <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
                  {loading ? t('loading') : t('register')}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center mt-4">
          <LanguageToggle />
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
