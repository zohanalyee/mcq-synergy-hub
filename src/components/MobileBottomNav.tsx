import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Briefcase, ListChecks, Shield, LogOut, Settings, User, MessageSquare, Brain, Sun, Moon, Flame, Languages, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer } from 'vaul';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { prefetchRoute } from '@/lib/prefetchRoutes';

const TAB_COLORS = {
  home: { active: 'text-blue-500', inactive: 'text-blue-400/50', dot: 'bg-blue-500' },
  subjects: { active: 'text-emerald-500', inactive: 'text-emerald-400/50', dot: 'bg-emerald-500' },
  recruitment: { active: 'text-orange-500', inactive: 'text-orange-400/50', dot: 'bg-orange-500' },
  syllabus: { active: 'text-purple-500', inactive: 'text-purple-400/50', dot: 'bg-purple-500' },
  profile: { active: 'text-brand-gradient', inactive: 'text-foreground/50', dot: 'bg-brand-gradient' },
} as const;

const navItems = [
  { icon: Home, label: 'Home', path: '/', colorKey: 'home' as const },
  { icon: BookOpen, label: 'Subjects', path: '/subjects', colorKey: 'subjects' as const },
  { icon: Timer, label: 'Tests', path: '/mock-tests', colorKey: 'recruitment' as const },
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
  const [streak, setStreak] = useState(0);
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch streak count when sheet opens
  useEffect(() => {
    if (!user || !profileSheetOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('test_attempts')
          .select('completed_at')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
        if (cancelled || !data) return;
        const uniqueDays = new Set<string>();
        data.forEach((a: any) => {
          if (a.completed_at) {
            const d = new Date(a.completed_at);
            d.setHours(0, 0, 0, 0);
            uniqueDays.add(d.toISOString().split('T')[0]);
          }
        });
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sortedDays = Array.from(uniqueDays).sort().reverse();
        let s = 0;
        for (let i = 0; i < sortedDays.length; i++) {
          const expected = new Date(today);
          expected.setDate(today.getDate() - i);
          const expStr = expected.toISOString().split('T')[0];
          if (sortedDays[i] === expStr) s++;
          else if (i === 0 && sortedDays[0] === new Date(today.getTime() - 86400000).toISOString().split('T')[0]) s++;
          else break;
        }
        if (!cancelled) setStreak(s);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user, profileSheetOpen]);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    const messages: Record<Language, { title: string; desc: string }> = {
      en: { title: 'Language Updated', desc: 'English' },
      ur: { title: 'زبان تبدیل', desc: 'اردو' },
      sd: { title: 'ٻولي تبديل', desc: 'سنڌي' },
    };
    const msg = messages[value];
    toast({ title: msg.title, description: msg.desc, duration: 1500 });
  };

  // Immersive routes — hide bottom nav for full-focus test/quiz/auth sessions
  const IMMERSIVE_PATTERNS = [
    /^\/quiz-session(\/|$)/,
    /^\/test-session(\/|$)/,
    /^\/exam-session(\/|$)/,
    /^\/auth(\/|$)/,
    /^\/sign-in(\/|$)/,
    /^\/sign-up(\/|$)/,
    /^\/forgot-password(\/|$)/,
    /^\/reset-password(\/|$)/,
    /^\/verify-email(\/|$)/,
    /^\/verify-email-sent(\/|$)/,
    /^\/complete-profile(\/|$)/,
  ];
  const isImmersive = IMMERSIVE_PATTERNS.some((r) => r.test(location.pathname));

  // Hooks must run on every render — call BEFORE any early return.
  const scrollDirection = useScrollDirection({ threshold: 8, topOffset: 80 });
  const hidden = scrollDirection === 'down';

  if (!isMobile || isImmersive) return null;

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

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/analytics';

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 safe-area-pb transition-transform duration-300 ease-out",
          hidden ? "translate-y-full" : "translate-y-0",
        )}
      >
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
                  onMouseEnter={() => prefetchRoute(item.path)}
                  onTouchStart={() => prefetchRoute(item.path)}
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
                        isActive ? colors.active : colors.inactive
                      )}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      fill={isActive ? 'currentColor' : 'none'}
                      fillOpacity={isActive ? 0.15 : 0}
                    />
                  </motion.div>

                  <span className={cn(
                    "text-[9px] tracking-wide transition-colors duration-200",
                    isActive ? cn(colors.active, "font-semibold") : cn(colors.inactive, "font-medium")
                  )}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Profile Tab */}
            <Drawer.Root
              open={profileSheetOpen}
              onOpenChange={setProfileSheetOpen}
              dismissible={true}
              snapToSequentialPoint={true}
              shouldScaleBackground={false}
            >
              <Drawer.Trigger asChild>
                <motion.button
                  onMouseEnter={() => { prefetchRoute('/profile'); prefetchRoute('/analytics'); }}
                  onTouchStart={() => { prefetchRoute('/profile'); prefetchRoute('/analytics'); }}
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
                        ? "ring-[1.5px] ring-[hsl(var(--brand-from))] ring-offset-1 ring-offset-background"
                        : "ring-1 ring-border"
                    )}>
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className={cn(
                        "text-[8px] font-medium",
                        isProfileActive
                          ? "bg-brand-gradient text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {getInitials(user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  <span className={cn(
                    "text-[9px] tracking-wide transition-colors duration-200",
                    isProfileActive ? "text-brand-gradient font-semibold" : "text-foreground/50 font-medium"
                  )}>
                    You
                  </span>
                </motion.button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay 
                  className="fixed inset-0 bg-black/40 z-40" 
                  onClick={() => setProfileSheetOpen(false)}
                />
                <Drawer.Content
                  className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[90vh] overflow-y-auto outline-none"
                  style={{
                    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
                  }}
                >
                {/* Drag handle - tap to close */}
                <div
                  className="flex justify-center pt-2 pb-1 cursor-pointer active:opacity-60"
                  onClick={() => setProfileSheetOpen(false)}
                >
                  <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
                <div className="px-6 pb-6 pt-2">
                {user ? (
                  <>
                    <SheetHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-4 text-white shadow-md">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-12 w-12 ring-2 ring-white/40 shrink-0">
                            <AvatarImage src={profile?.avatar_url || ''} />
                            <AvatarFallback className="bg-white/20 text-white font-medium">
                              {getInitials(user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left min-w-0">
                            <SheetTitle className="text-base text-white truncate">{getDisplayName()}</SheetTitle>
                            <span className="text-xs text-white/80 truncate">{user?.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shrink-0">
                          <Flame className={cn("h-4 w-4", streak > 0 ? "text-orange-200" : "text-white/70")} />
                          <span className="text-xs font-semibold text-white whitespace-nowrap">
                            {streak} {streak === 1 ? 'Day' : 'Days'}
                          </span>
                        </div>
                      </div>
                    </SheetHeader>
                    <Separator className="my-3" />
                    <div className="space-y-1">
                      {[
                        { path: '/analytics', icon: Brain, label: 'Dashboard & AI Coach', iconClass: 'text-cyan-500', bgClass: 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40' },
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

                      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40">
                        <Languages className="h-5 w-5 text-indigo-500 shrink-0" />
                        <span className="text-sm font-medium">Language</span>
                        <div className="ml-auto flex items-center gap-1">
                          {([
                            { code: 'en' as Language, label: 'EN' },
                            { code: 'ur' as Language, label: 'اردو' },
                            { code: 'sd' as Language, label: 'سنڌي' },
                          ]).map((opt) => (
                            <button
                              key={opt.code}
                              onClick={() => handleLanguageChange(opt.code)}
                              className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                                language === opt.code
                                  ? "bg-indigo-500 text-white shadow-sm"
                                  : "bg-white/60 dark:bg-white/10 text-foreground/70 hover:bg-white"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

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
                  </>
                ) : (
                  <>
                    <SheetHeader className="pb-2">
                      <SheetTitle className="text-base">Welcome</SheetTitle>
                      <span className="text-xs text-muted-foreground">Sign in to access your profile and settings</span>
                    </SheetHeader>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <button
                        onClick={() => handleProfileAction('/sign-in')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-gradient text-primary-foreground font-semibold text-sm shadow-brand hover:brightness-110 hover:shadow-glow"
                      >
                        Sign In
                      </button>

                      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/40 transition-colors text-left">
                        {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-sky-500" />}
                        <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>
                    </div>
                  </>
                )}
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
          </div>
        </div>
      </nav>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default MobileBottomNav;
