import { motion } from "framer-motion";

interface QuizTimerRingProps {
  remaining: number; // seconds left
  total: number;     // total seconds
  size?: number;
}

const QuizTimerRing = ({ remaining, total, size = 52 }: QuizTimerRingProps) => {
  const pct = Math.max(0, Math.min(1, remaining / total));
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  // urgent < 30%
  const urgent = pct < 0.3;
  const gradId = "quizTimerGradient";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {urgent ? (
              <>
                <stop offset="0%" stopColor="hsl(var(--destructive))" />
                <stop offset="100%" stopColor="hsl(var(--destructive))" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="hsl(var(--brand-from, var(--primary)))" />
                <stop offset="50%" stopColor="hsl(var(--brand-via, var(--primary)))" />
                <stop offset="100%" stopColor="hsl(var(--brand-to, var(--accent)))" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={3}
          fill="none"
          className="text-muted/40"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${
          urgent ? "text-destructive" : "text-brand-gradient"
        }`}
      >
        {Math.max(0, Math.ceil(remaining))}
      </div>
    </div>
  );
};

export default QuizTimerRing;
