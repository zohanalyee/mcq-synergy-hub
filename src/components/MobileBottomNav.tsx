import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Briefcase, ListChecks, Shield, LogOut, Settings, User, MessageSquare, LayoutDashboard, Sun, Moon } from 'lucide-react';
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

// Color configuration for each tab
const TAB_COLORS = {
  home: {
    active: 'text-blue-500',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500',
  },
  subjects: {
    active: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500',
  },
  recruitment: {
    active: 'text-orange-500',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500',
  },
  syllabus: {
    active: 'text-purple-500',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500',
  },
  profile: {
    active: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    ring: 'ring-indigo-500',
  },
} as const;

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
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!isMobile) return null;

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const handleProfileAction = (path: string) => {
    setProfileSheetOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setProfileSheetOpen(false);
    await signOut();
  };

  const handleOpenSettings = () => {
    setProfileSheetOpen(false);
    setSettingsOpen(true);
  };

  // Updated nav items with color keys
  const navItems = [
    { icon: Home, label: 'Home', path: '/', colorKey: 'home' as const },
    { icon: BookOpen, label: 'Subjects', path: '/subjects', colorKey: 'subjects' as const },
    { icon: Briefcase, label: 'Tests', path: '/mock-tests', colorKey: 'recruitment' as const },
    { icon: ListChecks, label: 'Syllabus', path: '/custom-syllabus', colorKey: 'syllabus' as const },
  ];

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/dashboard';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const colors = TAB_COLORS[item.colorKey];
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300",
                  isActive ? colors.active : "text-slate-400"
                )}
              >
                {/* Background pill glow for active state */}
                <div className={cn(
                  "absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl transition-all duration-300",
                  isActive ? colors.bg : "bg-transparent"
                )} />
                
                <item.icon className={cn(
                  "relative z-10 h-5 w-5 transition-all duration-300",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "relative z-10 text-[10px] font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Profile Tab with Sheet Menu */}
          <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-300",
                  isProfileActive ? TAB_COLORS.profile.active : "text-slate-400"
                )}
              >
                {/* Background pill glow for active state */}
                <div className={cn(
                  "absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl transition-all duration-300",
                  isProfileActive ? TAB_COLORS.profile.bg : "bg-transparent"
                )} />
                
                <Avatar className={cn(
                  "relative z-10 h-6 w-6 transition-all duration-300",
                  isProfileActive 
                    ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-background scale-110" 
                    : "ring-1 ring-slate-300 dark:ring-slate-600"
                )}>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className={cn(
                    "text-[10px] font-medium",
                    isProfileActive 
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  )}>
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "relative z-10 text-[10px] font-medium transition-all duration-300",
                  isProfileActive && "font-semibold"
                )}>
                  Profile
                </span>
              </button>
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
                <button
                  onClick={() => handleProfileAction('/dashboard')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => handleProfileAction('/admin')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Admin Panel</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleProfileAction('/profile')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile</span>
                </button>
                
                <button
                  onClick={() => handleProfileAction('/feedback')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Feedback</span>
                </button>
                
                <Separator className="my-2" />
                
                <button
                  onClick={handleOpenSettings}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
                
                <Separator className="my-2" />
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors text-left text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
};

export default MobileBottomNav;
