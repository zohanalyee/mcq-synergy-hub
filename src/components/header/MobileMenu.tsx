import { X, BrainCircuit, Sparkles, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  onSignOut,
}: MobileMenuProps) => {
  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
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
            <div className="relative rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 text-white animate-pulse drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]">
              <BrainCircuit className="h-5 w-5" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">MCQS</span>
              <span className="text-foreground">AI</span>
            </span>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform">
            <X className="h-4 w-4" />
          </button>
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
                  asChild
                  variant="link"
                  size="sm"
                  className="p-0 h-auto font-normal text-muted-foreground"
                >
                  <Link to="/profile" onClick={onClose}>View Profile</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          {navItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              onClick={onClose}
              className={`block text-left py-2 ${isActive(item.path) ? 'text-primary font-medium' : 'text-foreground/80 hover:text-foreground'} transition-colors`}
            >
              {item.title}
            </Link>
          ))}

          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">More Options</p>
            {secondaryNavItems.map((item) => (
              <Link
                key={item.title}
                to={item.path}
                onClick={onClose}
                className={`block text-left py-2 w-full ${isActive(item.path) ? 'text-primary font-medium' : 'text-foreground/80 hover:text-foreground'} transition-colors`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Admin panel button only visible to admin in mobile menu */}
          {user && isAdmin && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-primary/50"
            >
              <Link to="/admin" onClick={onClose}>
                <Shield className="h-4 w-4 text-primary" />
                Admin Panel
              </Link>
            </Button>
          )}

          <div className="pt-4 border-t border-border/40">
            {user ? (
              <div className="space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Link to="/analytics" onClick={onClose} title="View your progress and get AI-powered recommendations">Analytics & Insights</Link>
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
                asChild
                className="w-full backdrop-blur-sm bg-primary/80 hover:bg-primary/90"
              >
                <Link to="/sign-in" onClick={onClose}>Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MobileMenu;
