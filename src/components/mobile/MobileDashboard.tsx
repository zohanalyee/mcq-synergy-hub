import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Moon, 
  LayoutGrid, 
  MoreVertical, 
  Timer, 
  BookOpen, 
  MessageCircle,
  Clock,
  ClipboardList,
  Target,
  CheckCircle2,
  Settings,
  ChevronRight,
  Home,
  Trophy,
  BarChart3,
  User
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

const MobileDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', active: true },
    { icon: Trophy, label: 'Practice', path: '/subjects' },
    { icon: ClipboardList, label: 'Mock Tests', path: '/mock-tests' },
    { icon: BarChart3, label: 'Progress', path: '/dashboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">MCQs Point</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-slate-800/50 transition-colors">
            <Moon className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-800/50 transition-colors">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-800/50 transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 pt-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <span className="text-xs font-medium text-orange-400">
              Prepare Smarter, Score Higher
            </span>
          </div>
          
          {/* Headline with Gradient Text */}
          <h1 className="text-2xl font-bold leading-tight mb-3">
            Master MCQs with{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Precision
            </span>
            {' '}and{' '}
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Confidence
            </span>
          </h1>
          
          {/* Subtext */}
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Personalize your test preparation with custom syllabi, analytics-driven insights.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="space-y-4 mb-6">
          {/* Competitive Exams Card */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/mock-tests')}
            className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 p-5 text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <Timer className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Competitive Exams</h3>
                <p className="text-sm text-white/70">Practice full-length recruitment simulations</p>
              </div>
            </div>
            {/* Glassy Bottom Strip */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/10 backdrop-blur-md flex items-center justify-between px-5">
              <span className="text-sm font-semibold text-white">Get Started</span>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>

          {/* Subject-wise Practice Card */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/subjects')}
            className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-400 p-5 text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Subject-wise Practice</h3>
                <p className="text-sm text-white/70">Focus on specific subjects to strengthen knowledge</p>
              </div>
              {/* Floating Chat Bubble */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
            </div>
            {/* Glassy Bottom Strip */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-white/10 backdrop-blur-md flex items-center justify-between px-5">
              <span className="text-sm font-semibold text-white">Explore Subjects</span>
              <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        </div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          {/* Total Study Time */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">Study Time</span>
            </div>
            <p className="text-2xl font-bold text-white mb-2">22h</p>
            <div className="relative h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-blue-500 to-orange-400 rounded-full" />
            </div>
          </div>

          {/* Tests Completed */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs text-slate-400">Tests Done</span>
            </div>
            <p className="text-2xl font-bold text-white mb-2">12</p>
            <Progress value={60} className="h-1.5 bg-slate-700" indicatorClassName="bg-gradient-to-r from-orange-500 to-amber-400" />
          </div>

          {/* Accuracy Rate */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-xs text-slate-400">Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-white mb-2">85%</p>
            <Progress value={85} className="h-1.5 bg-slate-700" indicatorClassName="bg-gradient-to-r from-pink-500 to-orange-400" />
          </div>

          {/* Questions Answered */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-md border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">Questions</span>
            </div>
            <p className="text-2xl font-bold text-white mb-2">240</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-emerald-500/60" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Settings Row */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-white/5 hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-white">Settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </motion.button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="flex items-center justify-around h-16 px-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/50">
          {navItems.map((item) => {
            const isActive = item.active || location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200",
                  isActive 
                    ? "text-orange-400" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileDashboard;
