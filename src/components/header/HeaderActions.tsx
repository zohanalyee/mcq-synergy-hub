import { Shield, LogOut, Sparkles, Zap, Settings2, Bell, LayoutGrid } from 'lucide-react';
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
import { useFloatingTools } from '@/contexts/FloatingToolsContext';
import { toolsConfig, ToolId } from '@/components/tools/FloatingToolsRenderer';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
  const { openTool } = useFloatingTools();
  const { toast } = useToast();
  const [hasNotifications] = useState(true);

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const getDisplayName = () => {
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
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

  const toolsList = Object.entries(toolsConfig).map(([id, config]) => ({
    id: id as ToolId,
    ...config,
  }));

  return (
    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
      {user && <StreakCounter />}
      <ThemeToggle />
      
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
        <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border">
          <DropdownMenuLabel className="text-xs">Tools</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {toolsList.map((tool) => (
            <DropdownMenuItem 
              key={tool.id} 
              onClick={() => openTool(tool.id)}
              className="text-sm py-1.5 cursor-pointer"
            >
              <span style={{ color: tool.color }} className="mr-2">{tool.icon}</span>
              {tool.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Bell */}
      {user && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full hover:bg-muted/50 transition-colors"
          onClick={() => toast({ title: 'Notifications', description: 'No new notifications' })}
        >
          <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          {hasNotifications && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      )}

      {/* User menu or sign in button */}
      {user ? (
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
            {/* User info in dropdown header */}
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
          className="h-8 text-xs backdrop-blur-sm bg-primary hover:bg-primary/90" 
          onClick={() => onNavigate('/sign-in')}
        >
          Sign In
        </Button>
      )}
    </div>
  );
};

export default HeaderActions;