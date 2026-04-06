import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { X, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt = () => {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isPreview = window.location.hostname.includes('id-preview--') || window.location.hostname.includes('lovableproject.com');
    if (isInIframe || isPreview) return;

    const dismissed = localStorage.getItem('harusi-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua);
    setIsIOS(isiOS);

    if (isiOS) {
      setTimeout(() => setShowPrompt(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('harusi-install-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[60] mx-auto max-w-sm"
        >
          <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-gold">
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-gold-gradient p-3">
                {isIOS ? <Share2 className="h-6 w-6 text-primary-foreground" /> : <Download className="h-6 w-6 text-primary-foreground" />}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg">{t('installTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isIOS
                    ? (language === 'sw' ? t('iosInstallSw') : t('iosInstall'))
                    : t('installDesc')}
                </p>
                {!isIOS && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleInstall}
                      className="rounded-lg bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      {t('installNow')}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                    >
                      {t('later')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
