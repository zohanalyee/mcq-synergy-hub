import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, Trophy, Shield, LogOut, Settings, User, MessageSquare, LayoutDashboard } from 'lucide-react';
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
import { useState } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Define nav items - Profile uses avatar instead of icon
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Subjects', path: '/subjects' },
    { icon: ClipboardList, label: 'Exams', path: '/mock-tests' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
  ];

  const isProfileActive = location.pathname === '/profile' || location.pathname === '/dashboard';

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
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
                {isActive && (
                  <div className="absolute bottom-1 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}

          {/* Profile Tab with Sheet Menu */}
          <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all duration-200",
                  isProfileActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Avatar className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isProfileActive 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" 
                    : "ring-1 ring-border"
                )}>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className={cn(
                    "text-[10px] font-medium",
                    isProfileActive 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn(
                  "text-[10px] font-medium",
                  isProfileActive && "font-semibold"
                )}>
                  Profile
                </span>
                {isProfileActive && (
                  <div className="absolute bottom-1 w-8 h-0.5 bg-primary rounded-full" />
                )}
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
