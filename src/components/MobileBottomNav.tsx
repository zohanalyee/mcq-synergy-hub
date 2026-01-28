import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  if (!isMobile) return null;

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  // Define nav items - Profile uses avatar instead of icon
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: BookOpen, label: 'Subjects', path: '/subjects' },
    { icon: ClipboardList, label: 'Exams', path: '/mock-tests' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: null, label: 'Profile', path: '/profile', isProfile: true },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          // Profile tab with avatar
          if (item.isProfile) {
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
                <Avatar className={cn(
                  "h-6 w-6 transition-all duration-200",
                  isActive 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" 
                    : "ring-1 ring-border"
                )}>
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className={cn(
                    "text-[10px] font-medium",
                    isActive 
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {getInitials(user?.email)}
                  </AvatarFallback>
                </Avatar>
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
          }

          // Regular nav items with icons
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
              {item.icon && (
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
              )}
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
      </div>
    </nav>
  );
};

export default MobileBottomNav;
