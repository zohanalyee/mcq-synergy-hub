import { motion } from "framer-motion";
import { Clock, CheckCircle, Target, HelpCircle } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  delay: number;
}

const StatCard = ({ icon, value, label, color, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="relative overflow-hidden rounded-2xl p-3 md:p-4
               bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10
               shadow-sm hover:shadow-md transition-all duration-300"
  >
    {/* Subtle gradient overlay */}
    <div 
      className="absolute inset-0 opacity-10"
      style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
    />
    
    <div className="relative z-10 flex items-center gap-2 md:gap-3">
      {/* Icon */}
      <div 
        className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      
      {/* Text */}
      <div className="min-w-0">
        <p className="text-lg md:text-xl font-bold text-foreground truncate">{value}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
    
    {/* Progress bar */}
    <div className="mt-2 h-1 rounded-full bg-muted/50 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "75%" }}
        transition={{ duration: 1, delay: delay + 0.3 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </motion.div>
);

const HeroStatsSection = () => {
  const stats = [
    {
      icon: <Clock className="w-4 h-4 md:w-5 md:h-5" />,
      value: "22h",
      label: "Total Study Time",
      color: "#3b82f6" // Blue
    },
    {
      icon: <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: "127",
      label: "Tests Completed",
      color: "#10b981" // Emerald
    },
    {
      icon: <Target className="w-4 h-4 md:w-5 md:h-5" />,
      value: "85%",
      label: "Accuracy Rate",
      color: "#f59e0b" // Amber
    },
    {
      icon: <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />,
      value: "240",
      label: "Questions Answered",
      color: "#8b5cf6" // Purple
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mt-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            color={stat.color}
            delay={index * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default HeroStatsSection;
