import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t, tr, language, isRTL } = useLanguage();
  const fontClass = isRTL ? 'font-nastaliq' : '';

  return (
    <footer className={cn("bg-card border-t border-border text-card-foreground layout-ltr", fontClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* About */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Orbitron, sans-serif' }}>MCQSAI</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tr('footer.description')}
            </p>
            <p className="text-sm font-medium mt-2" style={{ color: '#4ade80' }}>
              🇵🇰 {t('footer.madeInPakistan')}
            </p>
          </div>

          {/* Popular Subjects */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Popular Subjects</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Biology MCQs', path: '/subjects' },
                { label: 'Chemistry MCQs', path: '/subjects' },
                { label: 'Physics MCQs', path: '/subjects' },
                { label: 'English MCQs', path: '/subjects' },
                { label: 'Mathematics MCQs', path: '/subjects' },
                { label: 'Computer Science', path: '/subjects' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice & Tests */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Practice & Tests</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: t('nav.subjects'), path: '/subjects' },
                { label: 'Mock Tests', path: '/mock-tests' },
                { label: 'Custom Syllabus', path: '/custom-syllabus' },
                { label: t('footer.pastPapers'), path: '/past-papers' },
                { label: t('nav.tools'), path: '/tools' },
                { label: t('footer.reviews'), path: '/reviews' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: t('footer.aboutUs'), path: '/about' },
                { label: t('nav.scholarships'), path: '/scholarships' },
                { label: t('nav.jobs'), path: '/jobs' },
                { label: t('footer.privacyPolicy'), path: '/privacy-policy' },
                { label: t('footer.termsOfService'), path: '/terms-of-service' },
                { label: t('footer.contactUs'), path: '/contact' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t('footer.contactUs')}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <a href="mailto:hello@mcqsai.com" className="text-muted-foreground hover:text-primary transition-colors">
                    hello@mcqsai.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">+92 300 1234567</span>
                  <p className="text-xs text-muted-foreground/70">Mon-Fri, 9 AM - 6 PM (PKT)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <span className="text-muted-foreground">Karachi, Sindh, Pakistan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {currentYear} MCQSAI. {t('footer.allRightsReserved')}.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms-of-service" className="hover:text-primary transition-colors">{t('footer.terms')}</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
