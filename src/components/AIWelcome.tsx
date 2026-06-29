import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedGreeting } from '@/lib/greetings';
import BrandMark from '@/components/BrandMark';

const AIWelcome = () => {
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);
  const { t, language } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    if (user && location.pathname === '/' && !sessionStorage.getItem('ai-welcomed')) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('ai-welcomed', 'true');
  };

  if (!show || !user || location.pathname !== '/') return null;

  const userName = profile?.username || user.email?.split('@')[0] || 'Student';
  const greeting = getLocalizedGreeting(language, userName);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-md w-full mx-4"
          >
            <div className="bg-gradient-to-br from-primary via-accent to-primary p-[2px] rounded-2xl shadow-2xl">
              <div className="bg-card rounded-2xl p-6 relative">
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <BrandMark className="mb-4" />


                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-lg opacity-50"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{greeting}</h3>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm leading-relaxed text-foreground">
                    {t('welcome.welcomeBack')} <span className="font-semibold text-primary">MCQSAI</span>! {t('welcome.helpMessage')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/boards"
                    onClick={handleClose}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-sm font-medium hover:shadow-lg transition-all block text-center"
                  >
                    {t('common.startTest')}
                  </Link>
                  <Link
                    to="/analytics"
                    onClick={handleClose}
                    className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors block text-center"
                  >
                    {t('common.viewProgress')}
                  </Link>
                </div>

                <div className="absolute bottom-3 right-3 opacity-20 text-xs">🇵🇰</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AIWelcome;
