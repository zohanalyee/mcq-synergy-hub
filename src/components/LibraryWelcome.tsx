import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Landmark, Scale, FileText, GraduationCap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import BrandMark from '@/components/BrandMark';

const STORAGE_KEY = 'library-welcomed-larkana';

// Query params that identify a scan from the Shahnawaz Bhutto Library banner.
const isLibraryVisit = (search: string): boolean => {
  const params = new URLSearchParams(search);
  const utm = (params.get('utm_source') || '').toLowerCase();
  const src = (params.get('src') || '').toLowerCase();
  return utm === 'library_banner' || src === 'larkana_library';
};

const badges = [
  { icon: Stethoscope, emoji: '🩺', label: 'MDCAT & Medical Entrance' },
  { icon: Landmark, emoji: '🏛️', label: 'SPSC / CCE Prep' },
  { icon: Scale, emoji: '⚖️', label: 'FPSC & Federal Jobs' },
  { icon: FileText, emoji: '📝', label: 'STS / IBA Screening Tests' },
  { icon: GraduationCap, emoji: '🎓', label: 'Lectureship & Teaching Exams' },
];

const LibraryWelcome = () => {
  const location = useLocation();
  const [show, setShow] = useState(false);

  // Fireworks: bursts launched from random points, New-Year style.
  const fireCelebration = useCallback(() => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ['#6366f1', '#a855f7', '#22d3ee', '#f59e0b', '#ec4899', '#10b981'];

    (function frame() {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.9 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.9 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    // Periodic aerial "firework" bursts.
    const interval = window.setInterval(() => {
      if (Date.now() > end) {
        window.clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 60,
        spread: 360,
        startVelocity: 30,
        gravity: 0.9,
        ticks: 200,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors,
      });
    }, 500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (!isLibraryVisit(window.location.search)) return;

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
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="relative w-full max-w-lg"
          >
            {/* Glowing festive border */}
            <div className="rounded-3xl p-[2px] bg-gradient-to-br from-primary via-accent to-primary shadow-2xl">
              <div className="relative overflow-hidden rounded-3xl bg-card p-6 sm:p-8">
                {/* Animated glow blobs */}
                <motion.div
                  className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-accent/30 blur-3xl"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1.1, 1, 1.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <BrandMark />
                    <span className="text-2xl" aria-hidden="true">🎆</span>
                  </div>

                  <motion.div
                    initial={{ rotate: -8, scale: 0.8 }}
                    animate={{ rotate: [0, -6, 6, 0], scale: 1 }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
                    className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg"
                  >
                    <Sparkles className="h-7 w-7 text-primary-foreground" />
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl font-bold leading-tight text-foreground">
                    Welcome Aspirants of Shahnawaz Bhutto Library, Larkana! 🌟
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                    Your ultimate platform for MDCAT, SPSC, FPSC, STS, NTS, and Competitive
                    Exams success.
                  </p>

                  <div className="mt-5 grid gap-2">
                    {badges.map((b, i) => (
                      <motion.div
                        key={b.label}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-lg">
                          {b.emoji}
                        </span>
                        <span className="text-sm font-medium text-foreground">{b.label}</span>
                      </motion.div>
                    ))}
                  </div>

                  <Link
                    to="/mock-tests"
                    onClick={handleClose}
                    className="mt-6 block rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-3 text-center text-sm sm:text-base font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:brightness-110"
                  >
                    Start Practicing MCQs Now 🚀
                  </Link>

                  <div className="pointer-events-none absolute bottom-0 right-0 text-xs opacity-30">
                    🇵🇰
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LibraryWelcome;
