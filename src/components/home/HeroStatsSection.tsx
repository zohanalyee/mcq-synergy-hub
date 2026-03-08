import { motion } from "framer-motion";
import { Clock, CheckCircle, Target, HelpCircle, Sparkles } from "lucide-react";
import { useUserStats } from "@/hooks/useUserStats";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  gradient: string;
  delay: number;
  progress: number;
  loading?: boolean;
}

const StatCard = ({ icon, value, label, gradient, delay, progress, loading }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ scale: 1.03, y: -2 }}
    className={`relative overflow-hidden rounded-2xl p-3 md:p-4
               bg-gradient-to-br ${gradient}
               shadow-md hover:shadow-lg transition-all duration-300 text-white group cursor-default`}
  >
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    
    {/* Animated scan-line sweep */}
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)`,
      }}
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delay * 2 }}
    />

    {/* Shimmer sweep */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 + delay * 2, ease: "easeInOut" }}
      />
    </div>
    
    {/* Animated AI micro-icon */}
    <motion.div
      className="absolute top-1.5 right-1.5"
      animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.2, 1], opacity: [0.25, 0.5, 0.25] }}
      transition={{ duration: 3, repeat: Infinity, delay: delay }}
    >
      <Sparkles className="h-2.5 w-2.5 text-white/40" />
    </motion.div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-1.5">
        <motion.div 
          className="w-7 h-7 md:w-9 md:h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
          animate={{ boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 10px rgba(255,255,255,0.2)', '0 0 0px rgba(255,255,255,0)'] }}
          transition={{ duration: 3, repeat: Infinity, delay: delay }}
        >
          {icon}
        </motion.div>
        {loading ? (
          <Skeleton className="h-6 w-12 bg-white/30" />
        ) : (
          <p className="text-lg md:text-xl font-bold truncate">{value}</p>
        )}
      </div>
      
      {loading ? (
        <Skeleton className="h-3 w-20 bg-white/30 mb-1.5" />
      ) : (
        <p className="text-[10px] md:text-xs text-white/80 truncate">{label}</p>
      )}
      
      <div className="mt-1.5 h-1 rounded-full bg-white/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, delay: delay + 0.3 }}
          className="h-full rounded-full bg-white/60"
        />
      </div>
    </div>
  </motion.div>
);

const formatStudyTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
};

const HeroStatsSection = () => {
  const { totalStudyMinutes, testsCompleted, accuracyRate, questionsAnswered, loading } = useUserStats();

  const stats: Omit<StatCardProps, 'delay' | 'loading'>[] = [
    {
      icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
      value: formatStudyTime(totalStudyMinutes),
      label: "Total Study Time",
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      progress: Math.min((totalStudyMinutes / 600) * 100, 100),
    },
    {
      icon: <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: testsCompleted.toString(),
      label: "Tests Completed",
      gradient: "from-purple-500 via-purple-600 to-fuchsia-600",
      progress: Math.min((testsCompleted / 50) * 100, 100),
    },
    {
      icon: <Target className="w-4 h-4 md:w-5 md:h-5" />,
      value: `${accuracyRate}%`,
      label: "Accuracy Rate",
      gradient: "from-orange-500 via-red-500 to-pink-500",
      progress: accuracyRate,
    },
    {
      icon: <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: questionsAnswered.toString(),
      label: "Questions Answered",
      gradient: "from-teal-500 via-cyan-500 to-blue-500",
      progress: Math.min((questionsAnswered / 500) * 100, 100),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mt-2 md:mt-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            {...stat}
            delay={index * 0.1}
            loading={loading}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HeroStatsSection;
