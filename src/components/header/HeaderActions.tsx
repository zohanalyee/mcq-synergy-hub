
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
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Admin panel button only visible to admin */}
      {user && isAdmin && (
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden md:flex gap-1 border-primary/50"
          onClick={() => onNavigate('/admin')}
        >
          <Shield className="h-4 w-4 text-primary" />
          Admin
        </Button>
      )}

      <ThemeToggle />

      {/* User menu or sign in button */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('/dashboard')}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate('/feedback')}>
              Feedback
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSignOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button 
          className="hidden md:flex backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
          onClick={() => onNavigate('/sign-in')}
        >
          Sign In
        </Button>
      )}
    </div>
  );
};

export default HeaderActions;
