
import { Shield } from 'lucide-react';
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
import { LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <ThemeToggle />

      {/* User menu or sign in button */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden h-8 w-8">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-xs">{getInitials(user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-card backdrop-blur-xl border border-white/40 dark:border-border">
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
