import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';

const ResetPassword = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(language === 'sw' ? 'Neno la siri halilingani' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error(language === 'sw' ? 'Neno la siri liwe na herufi 6+' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'sw' ? 'Neno la siri limebadilishwa!' : 'Password updated successfully!');
      navigate('/auth');
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 text-center max-w-md w-full"
        >
          <KeyRound className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">
            {language === 'sw' ? 'Kiungo Batili' : 'Invalid Link'}
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            {language === 'sw'
              ? 'Kiungo hiki si sahihi au kimemalizika muda. Omba kiungo kipya.'
              : 'This link is invalid or expired. Please request a new one.'}
          </p>
          <Button onClick={() => navigate('/auth')} className="bg-gold-gradient text-primary-foreground">
            {language === 'sw' ? 'Rudi Kuingia' : 'Back to Login'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-display text-primary-foreground">Harusi Smart</h1>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-display font-semibold">
              {language === 'sw' ? 'Weka Neno Jipya la Siri' : 'Set New Password'}
            </h2>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label>{language === 'sw' ? 'Neno Jipya la Siri' : 'New Password'}</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label>{language === 'sw' ? 'Thibitisha Neno la Siri' : 'Confirm Password'}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full bg-gold-gradient text-primary-foreground shadow-gold" disabled={loading}>
              {loading
                ? (language === 'sw' ? 'Inabadilisha...' : 'Updating...')
                : (language === 'sw' ? 'Badilisha Neno la Siri' : 'Update Password')}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
