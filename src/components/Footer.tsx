import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useSocialLinks } from '@/hooks/useSocialLinks';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t, tr, isRTL } = useLanguage();
  const fontClass = isRTL ? 'font-nastaliq' : '';
  const { data: socialLinks } = useSocialLinks();

  const activeSocials = [
    { key: 'facebook', url: socialLinks?.facebook, icon: Facebook, label: 'Facebook' },
    { key: 'instagram', url: socialLinks?.instagram, icon: Instagram, label: 'Instagram' },
    { key: 'tiktok', url: socialLinks?.tiktok, icon: null, label: 'TikTok' },
    { key: 'twitter', url: socialLinks?.twitter, icon: Twitter, label: 'Twitter' },
    { key: 'youtube', url: socialLinks?.youtube, icon: Youtube, label: 'YouTube' },
  ].filter(s => s.url);

  return (
    <footer className={cn("bg-brand-gradient text-white layout-ltr", fontClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* About */}
          <div className="space-y-3 col-span-2 sm:col-span-1">
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>MCQSAI</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              {tr('footer.description')}
            </p>
            <p className="text-sm font-medium mt-2 text-white">
              🇵🇰 {t('footer.madeInPakistan')}
            </p>
            {activeSocials.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                {activeSocials.map(({ key, url, icon: Icon, label }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.93a8.16 8.16 0 004.77 1.52V7a4.85 4.85 0 01-1.01-.31z"/>
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Popular Subjects */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Popular Subjects</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Biology MCQs', path: '/subjects' },
                { label: 'Chemistry MCQs', path: '/subjects' },
                { label: 'Physics MCQs', path: '/subjects' },
                { label: 'English MCQs', path: '/subjects' },
                { label: 'Browse by Board', path: '/boards' },
                { label: 'Computer Science', path: '/subjects' },
              ].map(link => (
                <li key={link.label}>
                  <Link to={link.path} className="text-white/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice & Tests */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Practice & Tests</h4>
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
                  <Link to={link.path} className="text-white/80 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Resources</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Blog', path: '/blog' },
                { label: 'FAQ', path: '/faq' },
                { label: 'Scholarships', path: '/scholarships' },
                { label: 'Jobs', path: '/jobs' },
                { label: 'Government Tenders', path: '/tenders', badge: '🔥' },
                { label: 'Board Results', path: '/board-results', badge: 'New' },
                { label: t('footer.aboutUs'), path: '/about' },
                { label: t('footer.contactUs'), path: '/contact' },
              ].map(link => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/80 hover:text-white transition-colors inline-flex items-center gap-1.5">
                    {link.label}
                    {link.badge && (
                      <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-full leading-none">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{t('footer.contactUs')}</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-white/80 mt-0.5 shrink-0" />
                <div>
                  <a href="mailto:hello@mcqsai.com" className="text-white/80 hover:text-white transition-colors">
                    hello@mcqsai.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-white/80 mt-0.5 shrink-0" />
                <div>
                  <span className="text-white/80">+92 300 1234567</span>
                  <p className="text-xs text-white/60">Mon-Fri, 9 AM - 6 PM (PKT)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-white/80 mt-0.5 shrink-0" />
                <span className="text-white/80">Karachi, Sindh, Pakistan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <p>© {currentYear} MCQSAI. {t('footer.allRightsReserved')}.</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
            <Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
