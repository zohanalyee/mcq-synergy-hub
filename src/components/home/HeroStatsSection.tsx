import { motion } from "framer-motion";
import { Clock, CheckCircle, Target, HelpCircle } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  delay: number;
  progress: number;
  loading?: boolean;
}

const StatCard = ({ icon, value, label, color, delay, progress, loading }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative overflow-hidden rounded-2xl p-3 md:p-4
               bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10
               shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div 
      className="absolute inset-0 opacity-10"
      style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
    />
    
    <div className="relative z-10 flex items-center gap-2 md:gap-3">
      <div 
        className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      
      <div className="min-w-0">
        {loading ? (
          <>
            <Skeleton className="h-5 w-12 mb-1" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <p className="text-lg md:text-xl font-bold text-foreground truncate">{value}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</p>
          </>
        )}
      </div>
    </div>
    
    <div className="mt-2 h-1 rounded-full bg-muted/50 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(progress, 100)}%` }}
        transition={{ duration: 1, delay: delay + 0.3 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </motion.div>
);

const formatStudyTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

const HeroStatsSection = () => {
  const { totalStudyMinutes, testsCompleted, accuracyRate, questionsAnswered, loading } = useUserStats();

  const stats = [
    {
      icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
      value: formatStudyTime(totalStudyMinutes),
      label: "Total Study Time",
      color: "#3b82f6",
      progress: Math.min((totalStudyMinutes / 600) * 100, 100)
    },
    {
      icon: <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: testsCompleted.toString(),
      label: "Tests Completed",
      color: "#10b981",
      progress: Math.min((testsCompleted / 50) * 100, 100)
    },
    {
      icon: <Target className="w-4 h-4 md:w-5 md:h-5" />,
      value: `${accuracyRate}%`,
      label: "Accuracy Rate",
      color: "#f59e0b",
      progress: accuracyRate
    },
    {
      icon: <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: questionsAnswered.toString(),
      label: "Questions Answered",
      color: "#8b5cf6",
      progress: Math.min((questionsAnswered / 500) * 100, 100)
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mt-2 md:mt-4"
    >
      {/* Mobile: compact inline stats row */}
      <div className="flex md:hidden items-center justify-center gap-3 text-xs text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              {formatStudyTime(totalStudyMinutes)}
            </span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              {testsCompleted}
            </span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3 text-amber-500" />
              {accuracyRate}%
            </span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3 text-purple-500" />
              {questionsAnswered}
            </span>
          </>
        )}
      </div>

      {/* Desktop: full stat cards grid */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            delay={index * 0.1}
            progress={stat.progress}
            loading={loading}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HeroStatsSection;
