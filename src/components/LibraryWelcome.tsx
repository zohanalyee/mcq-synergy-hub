import { useState, useLayoutEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Landmark, Scale, FileText, GraduationCap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import BrandMark from '@/components/BrandMark';

const STORAGE_KEY = 'library-welcomed-larkana';

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
  if (utm === 'library_banner' || src === 'larkana_library') return true;

  // Fallback: some scanners strip the "?" but keep the raw string in the URL.
  const raw = `${pathname}${search}`.toLowerCase();
  return raw.includes('library_banner') || raw.includes('larkana_library') || raw.includes('larkana');
};

const badges = [
  { icon: Stethoscope, emoji: '🩺', label: 'MDCAT & Medical Entrance' },
  { icon: Landmark, emoji: '🏛️', label: 'SPSC / CCE Prep' },
  { icon: Scale, emoji: '⚖️', label: 'FPSC & Federal Jobs' },
  { icon: FileText, emoji: '📝', label: 'STS / NTS Screening Tests' },
  { icon: GraduationCap, emoji: '🎓', label: 'Lectureship & Teaching Exams' },
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

  // Continuous multi-color party-popper crackers from both edges for 3s.
  const fireCelebration = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#facc15', '#f59e0b', '#6366f1', '#a855f7', '#22d3ee', '#ec4899', '#10b981'];

    (function frame() {
      // Left edge popper
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 75,
        startVelocity: 55,
        origin: { x: 0, y: 0.85 },
        colors,
      });
      // Right edge popper
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 75,
        startVelocity: 55,
        origin: { x: 1, y: 0.85 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Periodic aerial bursts for a firework feel.
    const interval = window.setInterval(() => {
      if (Date.now() > end) {
        window.clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 70,
        spread: 360,
        startVelocity: 30,
        gravity: 0.9,
        ticks: 200,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors,
      });
    }, 450);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (!isLibraryVisit(location.pathname, window.location.search)) return;

    const timer = setTimeout(() => {
      setShow(true);
      fireCelebration();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleClose = () => {
    setShow(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative my-auto w-[92%] max-w-md md:max-w-2xl"
          >
            {/* Glowing gold border */}
            <motion.div
              className="rounded-3xl p-[2px] bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600"
              animate={{
                boxShadow: [
                  '0 0 25px 2px rgba(250,204,21,0.35)',
                  '0 0 55px 8px rgba(245,158,11,0.55)',
                  '0 0 25px 2px rgba(250,204,21,0.35)',
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-[#0b0b14] p-6 sm:p-8">
                {/* Animated glow blobs */}
                <motion.div
                  className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-amber-500/25 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-yellow-400/25 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.1, 1, 1.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative">
                  <div className="mb-4 flex items-center justify-between">
                    <BrandMark />
                    <span className="text-2xl" aria-hidden="true">🎆</span>
                  </div>

                  <motion.div
                    initial={{ rotate: -8, scale: 0.8 }}
                    animate={{ rotate: [0, -6, 6, 0], scale: 1 }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
                    className="mb-3 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg"
                  >
                    <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-black" />
                  </motion.div>

                  <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold leading-tight text-amber-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.4)]">
                    CONGRATULATIONS ASPIRANTS OF SHAHNAWAZ BHUTTO LIBRARY, LARKANA! 🌟
                  </h2>
                  <p className="mt-2.5 text-sm md:text-base font-medium text-slate-200">
                    Your Gateway to Exam Success. MDCAT, SPSC, FPSC, STS &amp; NTS Mock Tests &amp;
                    Practice MCQs.
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-amber-200/80">
                    Scan to Access Free Online Test Portal
                  </p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {badges.map((b, i) => (
                      <motion.div
                        key={b.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-center gap-3 rounded-xl border border-amber-400/20 bg-white/5 px-3 py-2"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/25 to-yellow-500/25 text-lg">
                          {b.emoji}
                        </span>
                        <span className="text-sm font-medium text-slate-100">{b.label}</span>
                      </motion.div>
                    ))}
                  </div>


                  <Link
                    to="/mock-tests"
                    onClick={handleClose}
                    className="mt-5 block rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-5 py-3 text-center text-sm sm:text-base font-extrabold uppercase tracking-wide text-black shadow-[0_0_25px_rgba(250,204,21,0.5)] transition-all hover:shadow-[0_0_40px_rgba(250,204,21,0.8)] hover:brightness-110"
                  >
                    Start Practicing MCQs Now 🚀
                  </Link>

                  <button
                    onClick={handleClose}
                    className="mt-3 block w-full text-center text-xs text-slate-400 transition-colors hover:text-slate-200"
                  >
                    Maybe later
                  </button>

                  <div className="pointer-events-none absolute bottom-0 right-0 text-xs opacity-30">
                    🇵🇰
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LibraryWelcome;
