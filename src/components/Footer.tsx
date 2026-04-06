import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card pb-20 md:pb-0">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-display font-bold text-gold-gradient mb-2">Harusi Smart</h3>
            <p className="text-sm text-muted-foreground">{t('footerTagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t('quickLinks')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/vendors" className="block hover:text-primary transition-colors">{t('vendors')}</Link>
              <Link to="/planner" className="block hover:text-primary transition-colors">{t('planner')}</Link>
              <Link to="/budget" className="block hover:text-primary transition-colors">{t('budget')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t('support')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="hover:text-primary transition-colors cursor-pointer">{t('contactUs')}</p>
              <p className="hover:text-primary transition-colors cursor-pointer">{t('aboutUs')}</p>
              <p className="hover:text-primary transition-colors cursor-pointer">{t('privacyPolicy')}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 Harusi Smart. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
