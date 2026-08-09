import { useState, useLayoutEffect, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Landmark, Scale, FileText, GraduationCap, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import BrandMark from '@/components/BrandMark';

const STORAGE_KEY = 'library-welcomed-larkana';

// The curated starter surface a scanner lands on — a pre-filtered single test,
// so it is one tap from scan to questions instead of the full catalogue.
const STARTER_TEST_PATH = '/mock-tests?q=NTS%20GAT';

// Detects a scan from the Shahnawaz Bhutto Library banner.
// URL-strip proof: matches the dedicated /larkana path OR the tracking params,
// so it works even when in-app browsers (Google Lens, iPhone Camera, Android
// QR scanners) drop or rewrite the query string.
const isLibraryVisit = (pathname: string, search: string): boolean => {
  const path = (pathname || '').toLowerCase().replace(/\/+$/, '');
  if (path === '/larkana') return true;

  const params = new URLSearchParams(search);
  const utm = (params.get('utm_source') || '').toLowerCase();
  const src = (params.get('src') || '').toLowerCase();
  const campaign = (params.get('utm_campaign') || '').toLowerCase();
  if (utm === 'library_banner' || src === 'larkana_library' || campaign === 'larkana_library') return true;

  // Fallback: some scanners strip the "?" but keep the raw string in the URL.
  const raw = `${pathname}${search}`.toLowerCase();
  return raw.includes('library_banner') || raw.includes('larkana_library') || raw.includes('larkana');
};

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Exam chooser — every chip deep-links to real, ready content.
const examChoices = [
  { icon: Stethoscope, label: 'MDCAT', to: '/mock-tests?q=MDCAT' },
  { icon: Landmark, label: 'SPSC / CCE', to: '/mock-tests?q=Sindh' },
  { icon: Scale, label: 'FPSC & Federal', to: '/mock-tests?q=FPSC' },
  { icon: FileText, label: 'STS / NTS', to: '/mock-tests?q=NTS' },
  { icon: GraduationCap, label: 'Class 9–12', to: '/boards' },
];

const LibraryWelcome = () => {
  const location = useLocation();
  // Compute visibility synchronously on first render so the backdrop overlay
  // paints on the very first frame — no post-hydration flash of base content.
  const [show, setShow] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return false;
    } catch {}
    return isLibraryVisit(window.location.pathname, window.location.search);
  });

  const celebrated = useRef(false);

  // Single light party-popper burst on top of the modal — no repeating interval,
  // so low-end Android phones aren't fighting confetti for their first paint.
  const fireCelebration = useCallback(() => {
    if (celebrated.current) return;
    celebrated.current = true;
    if (prefersReducedMotion()) return;

    const colors = ['#a855f7', '#8b5cf6', '#22d3ee', '#06b6d4', '#facc15'];
    confetti({ particleCount: 16, angle: 60, spread: 70, startVelocity: 50, origin: { x: 0, y: 0.9 }, colors, zIndex: 99999 });
    confetti({ particleCount: 16, angle: 120, spread: 70, startVelocity: 50, origin: { x: 1, y: 0.9 }, colors, zIndex: 99999 });
  }, []);

  // Fire the celebration synchronously before paint when the modal is shown,
  // and re-check on client-side route changes into /larkana.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    if (!isLibraryVisit(location.pathname, window.location.search)) return;
    setShow(true);
    fireCelebration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Lock body scroll immediately (0ms) while the modal is visible to stop mobile flash.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    if (show) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [show]);

  useEffect(() => () => {
    confetti.reset();
  }, []);

  const handleClose = () => {
    confetti.reset();
    setShow(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-background/85 p-3 sm:backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="library-welcome-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative my-auto w-full max-w-sm md:max-w-lg [will-change:transform]"
          >
            <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/70 to-accent p-[1.5px] shadow-2xl">
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between">
                  <BrandMark />
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="h-3 w-3" />
                    Free
                  </span>
                </div>

                <h2
                  id="library-welcome-title"
                  className="text-base font-extrabold leading-snug text-foreground sm:text-lg md:text-xl"
                >
                  Welcome, Shahnawaz Bhutto Library aspirants!
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                  Pick your exam and start practising MCQs right now — no signup needed.
                </p>

                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {examChoices.map((choice) => {
                    const Icon = choice.icon;
                    return (
                      <Link
                        key={choice.label}
                        to={choice.to}
                        onClick={handleClose}
                        className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-muted/40 px-2.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 last:odd:col-span-2"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{choice.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <Link
                  to={STARTER_TEST_PATH}
                  onClick={handleClose}
                  className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-3 text-center text-sm font-extrabold uppercase tracking-wide text-primary-foreground shadow-lg transition-all hover:brightness-110"
                >
                  Start a quick test now
                </Link>

                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
                  <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
                  Practise as a guest — your result is saved to your account the moment you sign up.
                </p>

                <button
                  onClick={handleClose}
                  className="mt-2 block min-h-11 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LibraryWelcome;
