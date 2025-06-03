
import { X, BookOpen, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  title: string;
  path: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  user: any;
  profile: any;
  isAdmin: boolean;
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  isActive: (path: string) => boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => Promise<void>;
}

const MobileMenu = ({ 
  isOpen, 
  user, 
  profile, 
  isAdmin, 
  navItems, 
  secondaryNavItems, 
  isActive, 
  onClose, 
  onNavigate, 
  onSignOut 
}: MobileMenuProps) => {
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const handleNavigation = (path: string) => {
    onClose();
    onNavigate(path);
  };

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md animate-fade-in">
      <Card className="fixed right-0 top-0 h-full w-[300px] rounded-l-2xl rounded-r-none shadow-lg animate-slide-right overflow-auto bg-card/80 backdrop-blur-sm border border-border/50">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-1.5 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gradient">MCQs Point</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Mobile Menu Content */}
        <div className="flex flex-col p-4 space-y-4">
          {/* User Profile (if logged in) */}
          {user && (
            <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-border/40">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{profile?.username || user.email}</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto font-normal text-muted-foreground"
                  onClick={() => handleNavigation('/profile')}
                >
                  View Profile
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {navItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleNavigation(item.path)}
              className={`text-left py-2 ${isActive(item.path) ? 'text-primary font-medium' : 'text-foreground/80 hover:text-foreground'} transition-colors`}
            >
              {item.title}
            </button>
          ))}
          
          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">More Options</p>
            {secondaryNavItems.map((item) => (
              <button
                key={item.title}
                onClick={() => handleNavigation(item.path)}
                className={`text-left py-2 ${isActive(item.path) ? 'text-primary font-medium' : 'text-foreground/80 hover:text-foreground'} transition-colors block w-full`}
              >
                {item.title}
              </button>
            ))}
          </div>

          {/* Admin panel button only visible to admin in mobile menu */}
          {user && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-primary/50"
              onClick={() => handleNavigation('/admin')}
            >
              <Shield className="h-4 w-4 text-primary" />
              Admin Panel
            </Button>
          )}
          
          <div className="pt-4 border-t border-border/40">
            {user ? (
              <div className="space-y-2">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
                onClick={() => handleNavigation('/sign-in')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MobileMenu;
