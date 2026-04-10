import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { lovable } from '@/integrations/lovable/index';
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

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: String(result.error), variant: 'destructive' });
        return;
      }

      if (result.redirected) {
        return; // Browser is redirecting to Google
      }

      // Session set — HomeRedirect will handle role-based routing
      navigate('/', { replace: true });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Google sign-in failed', variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

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
      const metadata: Record<string, string> = { full_name: fullName, account_type: accountType };
      if (accountType === 'vendor') {
        metadata.business_name = businessName;
        metadata.category = category;
        metadata.city = city;
        metadata.description = description;
        metadata.phone = phone;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (authError) {
        toast({ title: language === 'sw' ? 'Hitilafu' : 'Error', description: authError.message, variant: 'destructive' });
        return;
      }

      // If email confirmation is required, session will be null
      if (authData.user && !authData.session) {
        toast({
          title: language === 'sw' ? 'Angalia barua pepe yako' : 'Check your email',
          description: language === 'sw'
            ? 'Tumekutumia kiungo cha kuthibitisha akaunti yako. Bonyeza kiungo hicho kisha ingia.'
            : 'We sent you a confirmation link. Please verify your email then log in.',
        });
        setAuthMode('login');
        return;
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

          {/* Google Sign-In — only for login or customer registration */}
          {authMode !== 'forgot' && !(authMode === 'register' && accountType === 'vendor') && (
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-3 py-5 text-sm font-medium"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading
                  ? (language === 'sw' ? 'Inaunganisha...' : 'Connecting...')
                  : (language === 'sw' ? 'Ingia na Google' : 'Continue with Google')}
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {language === 'sw' ? 'au' : 'or'}
                  </span>
                </div>
              </div>
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
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">+255</span>
                    <Input type="tel" className="rounded-l-none" placeholder="7XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
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
