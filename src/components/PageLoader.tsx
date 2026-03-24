import { useLoading } from '@/contexts/LoadingContext';
import { AnimatePresence } from 'framer-motion';
import BrandingLoader from '@/components/BrandingLoader';
import { useLanguage } from '@/contexts/LanguageContext';

const PageLoader = () => {
  const { isLoading } = useLoading();
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isLoading && (
        <BrandingLoader
          fullScreen
          message={t('welcome.platformTagline')}
          size="lg"
        />
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
