import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

const STORAGE_KEY = 'mcqsai_cookie_consent';

/**
 * Lightweight, dependency-free cookie notice.
 * Purely client-side: the choice is stored in localStorage, nothing is sent to
 * a server. Shown once until the visitor accepts or declines.
 */
const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Small delay so it never competes with first paint.
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* storage unavailable (private mode) — stay hidden */
    }
  }, []);

  const decide = (value: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-20 md:bottom-4 left-2 right-2 md:left-auto md:right-4 md:max-w-sm z-[70] overflow-hidden rounded-2xl border border-primary/20 bg-card/95 backdrop-blur shadow-xl"
    >
      {/* Brand gradient hairline */}
      <div className="h-1 w-full bg-brand-gradient" />

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <BrandMark className="scale-90 origin-left" />
          <Cookie className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        </div>

        <p className="mt-3 text-sm font-semibold text-foreground">
          Thori si cookies, behtar practice 🍪
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Yeh aapko signed-in rakhti hain, aapka progress aur streak yaad rakhti hain, aur humein
          batati hain kaunse tests students ke liye kaam kar rahe hain. Ads bhi inhi se chalte hain —
          isi wajah se platform aapke liye free hai. Details{' '}
          <Link to="/privacy-policy" className="text-primary font-medium hover:underline">
            Privacy Policy
          </Link>{' '}
          mein hain.
        </p>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="min-h-[44px] md:min-h-0 flex-1 bg-brand-gradient text-white border-0 hover:opacity-90"
            onClick={() => decide('accepted')}
          >
            Theek hai, chalein
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-[44px] md:min-h-0 flex-1 text-muted-foreground"
            onClick={() => decide('declined')}
          >
            Sirf zaroori
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
