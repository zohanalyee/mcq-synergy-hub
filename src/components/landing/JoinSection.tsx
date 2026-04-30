import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, BarChart3, Target, GraduationCap } from 'lucide-react';
import AnimatedNumber from '@/components/AnimatedNumber';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Tests',
    description: 'Generate unlimited MCQs with artificial intelligence',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track your progress with comprehensive insights',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    icon: GraduationCap,
    title: 'Personalized Learning',
    description: 'Adaptive paths tailored to your strengths',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: Target,
    title: 'Instant Results',
    description: 'Get detailed feedback on every question',
    gradient: 'from-amber-400 to-orange-500',
  },
];

const stats = [
  { value: 50000, suffix: '+', label: 'Questions', format: 'compact' as const },
  { value: 10000, suffix: '+', label: 'Students', format: 'compact' as const },
  { value: 95, suffix: '%', label: 'Pass Rate', format: 'plain' as const },
];

const TYPE_SPEED = 35;
const HOLD_MS = 1400;

/** Sequentially types description for one block, then advances to next. */
const useSequentialTyper = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'desc' | 'hold'>('desc');
  const [descLen, setDescLen] = useState(0);
  // Track which blocks have been "revealed" in the current cycle
  const [revealedCycle, setRevealedCycle] = useState(0);

  const reset = (toIndex: number, cycle: number) => {
    setActiveIndex(toIndex);
    setPhase('desc');
    setDescLen(0);
    setRevealedCycle(cycle);
  };

  return {
    activeIndex,
    phase,
    descLen,
    revealedCycle,
    setActiveIndex,
    setPhase,
    setDescLen,
    setRevealedCycle,
    reset,
  };
};

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  isActive: boolean;
  isRevealed: boolean;
  displayedTitle: string;
  displayedDescription: string;
  showTitleCursor: boolean;
  showDescCursor: boolean;
}

const FeatureItem = ({
  icon: Icon,
  title,
  description,
  gradient,
  isActive,
  isRevealed,
  displayedDescription,
  showDescCursor,
}: Omit<FeatureItemProps, 'displayedTitle' | 'showTitleCursor'>) => {
  const descText = isRevealed ? description : displayedDescription;

  return (
    <div className="group flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 hover:bg-white/[0.08] min-h-[76px]">
      <div className="relative flex-shrink-0">
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradient} opacity-0 blur-lg group-hover:opacity-40 transition-opacity duration-500`}
        />
        <div
          className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        {/* Heading is ALWAYS static — never animated */}
        <h3 className="font-semibold text-white text-sm mb-0.5 min-h-[1.25rem] whitespace-pre-wrap break-words">
          {title}
        </h3>
        <p className="text-xs text-blue-200/80 leading-relaxed min-h-[2.25rem] whitespace-pre-wrap break-words">
          {descText}
          {isActive && showDescCursor && (
            <span
              className="inline-block w-[1px] ml-0.5 align-middle bg-blue-200 animate-pulse"
              style={{ height: '0.9em' }}
              aria-hidden="true"
            />
          )}
        </p>
      </div>
    </div>
  );
};

const StatItem = ({
  value,
  suffix,
  label,
  index,
  format,
}: {
  value: number;
  suffix: string;
  label: string;
  index: number;
  format: 'plain' | 'compact';
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.9 + index * 0.1 }}
    className="text-center"
  >
    <div className="text-xl font-bold text-white tabular-nums">
      <AnimatedNumber value={value} suffix={suffix} format={format} duration={2400} />
    </div>
    <div className="text-xs text-blue-200/70">{label}</div>
  </motion.div>
);

export const JoinSection = () => {
  const seq = useSequentialTyper();
  const reducedMotionRef = useRef(false);
  const cycleRef = useRef(0);

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (reducedMotionRef.current) return;
    const f = features[seq.activeIndex];
    if (!f) return;

    let timer: ReturnType<typeof setTimeout>;

    if (seq.phase === 'desc') {
      if (seq.descLen < f.description.length) {
        timer = setTimeout(() => seq.setDescLen(seq.descLen + 1), TYPE_SPEED);
      } else {
        timer = setTimeout(() => seq.setPhase('hold'), 0);
      }
    } else if (seq.phase === 'hold') {
      timer = setTimeout(() => {
        const next = seq.activeIndex + 1;
        if (next >= features.length) {
          // Loop: bump cycle so all blocks reset their "revealed" state
          cycleRef.current += 1;
          seq.reset(0, cycleRef.current);
        } else {
          seq.setActiveIndex(next);
          seq.setPhase('desc');
          seq.setDescLen(0);
        }
      }, HOLD_MS);
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq.activeIndex, seq.phase, seq.descLen]);

  return (
    <div className="hidden lg:flex relative overflow-hidden flex-col justify-center items-center p-12 text-white">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 -z-0">
        <div
          className="absolute inset-0 mesh-gradient"
          style={{
            background:
              'linear-gradient(135deg, hsl(220 90% 42%), hsl(250 80% 38%), hsl(280 70% 32%), hsl(220 90% 42%))',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <motion.div
          className="absolute left-0 right-0 h-px opacity-20"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
          }}
          animate={{ y: ['-100%', '100vh'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, hsl(243 75% 59% / 0.6), transparent 70%)',
          }}
          animate={{ y: [0, -30, 0], x: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[8%] w-56 h-56 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, hsl(190 100% 60% / 0.5), transparent 70%)',
          }}
          animate={{ y: [0, 20, 0], x: [0, -12, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${8 + i * 8}%`,
              top: `${10 + ((i * 7) % 80)}%`,
            }}
            animate={{
              y: [0, -20 - (i % 3) * 10, 0],
              opacity: [0.15, 0.5, 0.15],
            }}
            transition={{
              duration: 4 + (i % 3) * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[hsl(243_75%_59%/0.3)] via-[hsl(214_90%_52%/0.2)] to-[hsl(190_100%_60%/0.3)] blur-xl opacity-60" />

          <div className="relative rounded-3xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-xl p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="relative w-14 h-14 mb-5">
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.25, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ filter: 'blur(8px)' }}
                />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2 leading-tight tracking-tight">
                Join MCQSAI
              </h2>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-blue-100">LIVE • Trusted by thousands</span>
              </motion.div>
            </motion.div>

            <div className="space-y-1 mb-6">
              {features.map((f, i) => {
                const isActive = i === seq.activeIndex;
                // Revealed = already-typed in this cycle (index < activeIndex)
                const isRevealed = reducedMotionRef.current || i < seq.activeIndex;
                const displayedDescription = isActive
                  ? f.description.slice(0, seq.descLen)
                  : '';
                return (
                  <FeatureItem
                    key={`${f.title}-${seq.revealedCycle}`}
                    icon={f.icon}
                    title={f.title}
                    description={f.description}
                    gradient={f.gradient}
                    isActive={isActive}
                    isRevealed={isRevealed}
                    displayedDescription={displayedDescription}
                    showDescCursor={isActive && seq.phase === 'desc'}
                  />
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="grid grid-cols-3 gap-2 pt-5 border-t border-white/[0.1]"
            >
              {stats.map((s, i) => (
                <StatItem key={s.label} {...s} index={i} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinSection;
