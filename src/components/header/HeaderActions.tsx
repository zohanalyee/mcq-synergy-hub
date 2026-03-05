import { Shield, LogOut, Settings, LayoutGrid, LayoutDashboard, User, MessageSquare } from 'lucide-react';
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
import { ALL_TOOLS, TOOL_CATEGORIES, CATEGORY_COLORS } from '@/data/toolsData';
import { useState } from 'react';
import SettingsDialog from '@/components/settings/SettingsDialog';
import NotificationBell from '@/components/notifications/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const categories = TOOL_CATEGORIES.filter(c => c !== 'All');

  return (
    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
      {user && <StreakCounter />}
      {!isMobile && <ThemeToggle />}
      
      {/* Tools Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full hover:bg-muted/50 transition-colors"
          >
            <LayoutGrid className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border p-0">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tools</span>
            <button
              onClick={() => onNavigate('/tools')}
              className="text-xs text-primary hover:underline font-medium"
            >
              View All
            </button>
          </div>
          <DropdownMenuSeparator className="my-0" />
          <ScrollArea className="max-h-[70vh]">
            {categories.map((category) => {
              const categoryTools = ALL_TOOLS.filter(t => t.category === category);
              const colors = CATEGORY_COLORS[category];
              return (
                <div key={category}>
                  <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${colors?.badge || 'text-muted-foreground'}`}>
                    {category}
                  </div>
                  {categoryTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <DropdownMenuItem 
                        key={tool.id} 
                        onClick={() => onNavigate(tool.href)}
                        className="text-sm py-1.5 cursor-pointer px-3 mx-1 rounded-md"
                      >
                        <Icon className={`mr-2 h-4 w-4 flex-shrink-0 ${colors?.badge || ''}`} />
                        <span className="truncate">{tool.name}</span>
                        {tool.popular && (
                          <span className="ml-auto text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            ★
                          </span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              );
            })}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <DropdownMenuContent align="end" className="w-52 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border">
              <DropdownMenuLabel className="flex items-center gap-3 py-3">
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
              <DropdownMenuItem onClick={() => onNavigate('/dashboard')} className="text-sm py-1.5">
                <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                My Dashboard
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => onNavigate('/admin')} className="text-sm py-1.5">
                  <Shield className="mr-2 h-3.5 w-3.5 text-primary" />
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onNavigate('/profile')} className="text-sm py-1.5">
                <User className="mr-2 h-3.5 w-3.5" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('/feedback')} className="text-sm py-1.5">
                <MessageSquare className="mr-2 h-3.5 w-3.5" />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="text-sm py-1.5">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSignOut()} className="text-sm py-1.5">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      ) : (
        <Button 
          size="sm"
          className="h-8 text-xs backdrop-blur-sm bg-primary hover:bg-primary/90" 
          onClick={() => onNavigate('/sign-in')}
        >
          Sign In
        </Button>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default HeaderActions;
