import { motion } from "framer-motion";
import { Brain, Sparkles, Zap, Activity } from "lucide-react";

type AdminHeaderProps = {
  pendingCount: number;
  scholarshipCount: number;
  mcqCount: number;
  quizCount: number;
  totalCount: number;
};

const AdminHeader = ({
  pendingCount,
  mcqCount,
  quizCount,
  totalCount,
}: AdminHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-violet-950/90 to-slate-900 dark:from-slate-950 dark:via-violet-950 dark:to-slate-950 p-5 md:p-6">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }} />
        
        {/* Glowing orbs */}
        <motion.div
          className="absolute -top-12 -right-12 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/15 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* AI Brain Icon with pulse */}
            <div className="relative">
              <motion.div
                className="absolute inset-0 rounded-xl bg-violet-500/30 blur-md"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-brand-gradient shadow-brand">
                <Brain className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                AI Command Center
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </motion.div>
              </h1>
              <p className="text-violet-200/70 text-sm mt-0.5">
                Intelligent content management powered by AI
              </p>
            </div>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap items-center gap-2">
            <StatChip icon={<Zap className="h-3 w-3" />} value={pendingCount} label="Pending" colorClass="from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30" />
            <StatChip icon={<Activity className="h-3 w-3" />} value={mcqCount} label="MCQs" colorClass="from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30" />
            <StatChip icon={<Sparkles className="h-3 w-3" />} value={quizCount} label="Quizzes" colorClass="from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30" />
            <StatChip icon={<Brain className="h-3 w-3" />} value={totalCount} label="Total" colorClass="from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatChip = ({ icon, value, label, colorClass }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  colorClass: string;
}) => (
  <motion.span
    whileHover={{ scale: 1.05 }}
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r border backdrop-blur-sm ${colorClass}`}
  >
    {icon}
    {value} {label}
  </motion.span>
);

export default AdminHeader;
