import { Shield, LogOut, Sparkles, Zap, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from '@/components/ui/theme-toggle';
import StreakCounter from '@/components/gamification/StreakCounter';
import { useDeviceCapability, PerformanceMode } from '@/hooks/useDeviceCapability';
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
  const { performanceMode, setPerformanceMode } = useDeviceCapability();
  const { toast } = useToast();

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const handleModeChange = (mode: string) => {
    setPerformanceMode(mode as PerformanceMode);
    
    const messages: Record<PerformanceMode, string> = {
      'auto': 'Auto mode enabled - Adjusting visuals based on your device',
      'high-quality': 'High quality mode enabled - Full visual effects active',
      'performance': 'Performance mode activated - Visuals reduced for speed',
    };
    
    toast({
      title: 'Visual Quality Updated',
      description: messages[mode as PerformanceMode],
    });
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {user && <StreakCounter />}
      {/* Theme toggle - visible on all screens */}
      <ThemeToggle />

      {/* User menu - hidden on mobile, visible on desktop */}

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden md:flex rounded-full overflow-hidden h-8 w-8">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs">{getInitials(user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border">
            <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('/dashboard')} className="text-sm py-1.5">
              Dashboard
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => onNavigate('/admin')} className="text-sm py-1.5">
                <Shield className="mr-2 h-3.5 w-3.5 text-primary" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onNavigate('/profile')} className="text-sm py-1.5">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate('/feedback')} className="text-sm py-1.5">
              Feedback
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Visual Quality Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-sm py-1.5">
                <Settings2 className="mr-2 h-3.5 w-3.5" />
                Visual Quality
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border">
                <DropdownMenuRadioGroup value={performanceMode} onValueChange={handleModeChange}>
                  <DropdownMenuRadioItem value="auto" className="text-sm py-1.5">
                    <Settings2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Auto (Detect)
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="high-quality" className="text-sm py-1.5">
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
                    High Quality
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="performance" className="text-sm py-1.5">
                    <Zap className="mr-2 h-3.5 w-3.5 text-amber-500" />
                    Performance
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSignOut()} className="text-sm py-1.5">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          size="sm"
          className="hidden md:flex h-8 text-xs backdrop-blur-sm bg-primary hover:bg-primary/90" 
          onClick={() => onNavigate('/sign-in')}
        >
          Sign In
        </Button>
      )}
    </div>
  );
};

export default HeaderActions;