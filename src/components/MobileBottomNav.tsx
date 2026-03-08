import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Briefcase, ListChecks, Shield, LogOut, Settings, User, MessageSquare, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';

const TAB_COLORS = {
  home: { active: 'text-blue-500', inactive: 'text-blue-400/50', dot: 'bg-blue-500' },
  subjects: { active: 'text-emerald-500', inactive: 'text-emerald-400/50', dot: 'bg-emerald-500' },
  recruitment: { active: 'text-orange-500', inactive: 'text-orange-400/50', dot: 'bg-orange-500' },
  syllabus: { active: 'text-purple-500', inactive: 'text-purple-400/50', dot: 'bg-purple-500' },
  profile: { active: 'text-indigo-500', inactive: 'text-indigo-400/50', dot: 'bg-indigo-500' },
} as const;

const navItems = [
  { icon: Home, label: 'Home', path: '/', colorKey: 'home' as const },
  { icon: BookOpen, label: 'Subjects', path: '/subjects', colorKey: 'subjects' as const },
  { icon: Briefcase, label: 'Tests', path: '/mock-tests', colorKey: 'recruitment' as const },
  { icon: ListChecks, label: 'Syllabus', path: '/custom-syllabus', colorKey: 'syllabus' as const },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (!isMobile) return null;

  const getInitials = (email?: string) => email?.charAt(0).toUpperCase() || 'U';
  const getDisplayName = () => profile?.username || user?.email?.split('@')[0] || 'User';
  const showAskDocsNew = !localStorage.getItem('visited_ask_docs');

  const handleProfileAction = (path: string) => {
    if (path === '/ask-document') localStorage.setItem('visited_ask_docs', 'true');
    setProfileSheetOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setProfileSheetOpen(false);
    await signOut();
  };

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/dashboard';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        {/* Glassmorphism bar */}
        <div className="bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-14 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const colors = TAB_COLORS[item.colorKey];

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-full"
                >
                  {/* Dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="navDot"
                      className={cn("absolute top-1 w-4 h-[3px] rounded-full", colors.dot)}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Icon with lift animation */}
                  <motion.div
                    animate={{ y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isActive ? colors.active : "text-muted-foreground"
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.15 : 0}
                    />
                  </motion.div>

                  <span className={cn(
                    "text-[9px] tracking-wide transition-colors duration-200",
                    isActive ? cn(colors.active, "font-semibold") : "text-muted-foreground font-medium"
                  )}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Profile Tab */}
            <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
              <SheetTrigger asChild>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative flex flex-col items-center justify-center gap-0.5 w-14 h-full"
                >
                  {isProfileActive && (
                    <motion.div
                      layoutId="navDot"
                      className={cn("absolute top-1 w-4 h-[3px] rounded-full", TAB_COLORS.profile.dot)}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  <motion.div animate={{ y: isProfileActive ? -1 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                    <Avatar className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isProfileActive
                        ? "ring-[1.5px] ring-indigo-500 ring-offset-1 ring-offset-background"
                        : "ring-1 ring-border"
                    )}>
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className={cn(
                        "text-[8px] font-medium",
                        isProfileActive
                          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {getInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  <span className={cn(
                    "text-[9px] tracking-wide transition-colors duration-200",
                    isProfileActive ? "text-indigo-500 font-semibold" : "text-muted-foreground font-medium"
                  )}>
                    You
                  </span>
                </motion.button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
                <SheetHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-medium">
                        {getInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col text-left">
                      <SheetTitle className="text-base">{getDisplayName()}</SheetTitle>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                </SheetHeader>
                <Separator className="my-3" />
                <div className="space-y-1">
                  {[
                    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', iconClass: 'text-blue-500', bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40' },
                    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin Panel', iconClass: 'text-violet-500', bgClass: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40' }] : []),
                    { path: '/profile', icon: User, label: 'Profile', iconClass: 'text-emerald-500', bgClass: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40' },
                    { path: '/feedback', icon: MessageSquare, label: 'Feedback', iconClass: 'text-amber-500', bgClass: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40' },
                  ].map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleProfileAction(item.path)}
                      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left", item.bgClass)}
                    >
                      <item.icon className={cn("h-5 w-5", item.iconClass)} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => handleProfileAction('/ask-document')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/40 dark:to-cyan-950/40 transition-colors text-left"
                  >
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium">Ask Docs</span>
                    {showAskDocsNew && (
                      <span className="ml-auto text-[10px] px-1.5 py-0 rounded-full bg-emerald-500 text-white font-semibold">NEW</span>
                    )}
                  </button>

                  <Separator className="my-2" />

                  <button onClick={() => { setProfileSheetOpen(false); setSettingsOpen(true); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 transition-colors text-left">
                    <Settings className="h-5 w-5 text-rose-500" />
                    <span className="text-sm font-medium">Settings</span>
                  </button>

                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 transition-colors text-left">
                    {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-sky-500" />}
                    <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <Separator className="my-2" />

                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40 transition-colors text-left text-destructive">
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default MobileBottomNav;
