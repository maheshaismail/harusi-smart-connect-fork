import { useLanguage } from '@/i18n/LanguageContext';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4 text-primary" />
      <span>{language === 'en' ? '🇬🇧 EN' : '🇹🇿 SW'}</span>
    </motion.button>
  );
};

export default LanguageToggle;
