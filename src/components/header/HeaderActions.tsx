// Language selector uses text badges instead of flag images
import { Shield, LogOut, Settings, LayoutGrid, LayoutDashboard, User, MessageSquare, Globe, Languages, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ThemeToggle } from '@/components/ui/theme-toggle';
import StreakCounter from '@/components/gamification/StreakCounter';
import { useState } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';
import NotificationBell from '@/components/notifications/NotificationBell';
import CreditMeter from '@/components/credits/CreditMeter';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';


interface HeaderActionsProps {
  theme?: string;
  user: any;
  profile: any;
  isAdmin: boolean;
  onToggleTheme: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => Promise<void>;
}

const HeaderActions = ({ 
  theme, 
  user, 
  profile, 
  isAdmin, 
  onToggleTheme, 
  onNavigate, 
  onSignOut
}: HeaderActionsProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
      {!isMobile && <ThemeToggle />}
      
      {/* Daily AI credits meter — clickable, opens credit history */}
      {user && <CreditMeter />}

      {/* Notification Bell */}
      {user && <NotificationBell />}

      {/* User menu or sign in button */}
      {user ? (
        !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-medium">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border p-1.5">
              <DropdownMenuLabel className="flex items-center gap-3 py-3 px-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-medium">
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 mb-0.5">
                <Link to="/analytics" title="View your progress and get AI-powered recommendations">
                  <Brain className="mr-2.5 h-4 w-4 text-cyan-500" />
                  {t('nav.aiCoach')}
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 mb-0.5">
                  <Link to="/admin">
                    <Shield className="mr-2.5 h-4 w-4 text-violet-500" />
                    {t('nav.adminPanel')}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 mb-0.5">
                <Link to="/profile">
                  <User className="mr-2.5 h-4 w-4 text-emerald-500" />
                  {t('nav.profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 mb-0.5">
                <Link to="/feedback">
                  <MessageSquare className="mr-2.5 h-4 w-4 text-amber-500" />
                  {t('nav.feedback')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 mb-0.5">
                <Settings className="mr-2.5 h-4 w-4 text-rose-500" />
                {t('nav.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSignOut()} className="text-sm py-2 px-2.5 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40">
                <LogOut className="mr-2.5 h-4 w-4 text-red-500" />
                <span>{t('nav.signOut')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      ) : (
        <Button
          size="sm"
          className="h-9 px-4 text-xs font-semibold rounded-xl bg-brand-gradient text-primary-foreground shadow-brand hover:brightness-110 hover:shadow-glow"
          onClick={() => onNavigate('/sign-in')}
        >
          {t('nav.signIn')}
        </Button>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default HeaderActions;
