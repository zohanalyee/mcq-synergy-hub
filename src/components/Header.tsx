
import { useState, useEffect } from 'react';
import { Laptop, Menu, Moon, Sun, X, BookOpen, FileText, Briefcase, Award, Shield, Upload, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = ({ theme, setTheme }: { theme?: string; setTheme?: (theme: string) => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { userRole, isAdmin } = useUserRole();
  const { user, profile, signOut } = useAuth();
  
  // Use try-catch to handle the case when Header is used outside Router context
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    console.log('Header is used outside of Router context');
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    if (navigate) {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  const toggleTheme = () => {
    if (setTheme) {
      setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark');
    }
  };

  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'Subjects', path: '/subjects' },
    { title: 'Scholarships', path: '/scholarships' },
    { title: 'Jobs', path: '/jobs' },
    { title: 'Mock Tests', path: '/mock-tests' },
  ];

  const secondaryNavItems = [
    { title: 'Analytics', path: '/analytics' },
    { title: 'Leaderboard', path: '/leaderboard' },
    { title: 'Past Papers', path: '/past-papers' },
    { title: 'Feedback', path: '/feedback' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getInitials = (email?: string) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'py-3 glass backdrop-blur-md bg-background/60 border-b border-border/40 shadow-sm' 
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo Section with better spacing */}
          <div 
            className="flex-shrink-0 cursor-pointer mr-6" 
            onClick={() => handleNavigation('/')}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-1.5 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gradient whitespace-nowrap">MCQs Point</span>
            </div>
          </div>

          {/* Spacer to push nav items to center */}
          <div className="flex-grow"></div>

          {/* Desktop Navigation with better centered positioning */}
          <NavigationMenu className="hidden md:flex mx-4">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    active={isActive(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.title}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}

              <NavigationMenuItem>
                <NavigationMenuTrigger>More</NavigationMenuTrigger>
                <NavigationMenuContent className="absolute top-full left-0 z-50 min-w-[200px] bg-background border border-border rounded-md shadow-md p-2">
                  <div className="grid grid-cols-1 gap-1">
                    {secondaryNavItems.map((item) => (
                      <Button
                        key={item.title}
                        variant="ghost"
                        className={`justify-start ${isActive(item.path) ? 'bg-accent' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                      >
                        {item.title}
                      </Button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Spacer to push actions to right */}
          <div className="flex-grow"></div>

          {/* Action buttons with consistent spacing */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Admin panel button only visible to admin */}
            {user && isAdmin && (
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex gap-1 border-primary/50"
                onClick={() => handleNavigation('/admin')}
              >
                <Shield className="h-4 w-4 text-primary" />
                Admin
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full hover:bg-background/80"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Laptop className="h-5 w-5" />
              )}
            </Button>

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
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/feedback')}>
                    Feedback
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="hidden md:flex backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
                onClick={() => handleNavigation('/sign-in')}
              >
                Sign In
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-full hover:bg-background/80"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md animate-fade-in">
          <Card className="fixed right-0 top-0 h-full w-[300px] rounded-l-2xl rounded-r-none shadow-lg animate-slide-right overflow-auto bg-card/80 backdrop-blur-sm border border-border/50">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-1.5 text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-gradient">MCQs Point</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
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
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNavigation('/profile');
                      }}
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleNavigation('/admin');
                  }}
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
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNavigation('/dashboard');
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
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
      )}
    </header>
  );
};

export default Header;
