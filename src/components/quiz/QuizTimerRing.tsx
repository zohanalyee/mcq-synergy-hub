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
  const colorClass = urgent ? "text-destructive" : "text-primary";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
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
          stroke="currentColor"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={colorClass}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${colorClass}`}>
        {Math.max(0, Math.ceil(remaining))}
      </div>
    </div>
  );
};

export default QuizTimerRing;
