import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

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
      className="fixed bottom-20 md:bottom-4 left-2 right-2 md:left-auto md:right-4 md:max-w-sm z-[70] rounded-xl border border-border bg-card/95 backdrop-blur p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <p>
            We use cookies to keep you signed in, remember preferences, and — through Google
            AdSense and Analytics — to measure usage and show ads. See our{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="min-h-[44px] md:min-h-0 flex-1" onClick={() => decide('accepted')}>
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] md:min-h-0 flex-1"
              onClick={() => decide('declined')}
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
