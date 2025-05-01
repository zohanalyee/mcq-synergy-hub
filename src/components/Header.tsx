
import { useState, useEffect } from 'react';
import { Laptop, Menu, Moon, Sun, X, BookOpen, FileText, Briefcase, Award, Shield, Upload } from 'lucide-react';
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

const Header = ({ theme, setTheme }: { theme?: string; setTheme?: (theme: string) => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { userRole, setUserRole, isAdmin } = useUserRole();
  
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

  // For demo purposes - toggle between user roles
  const toggleRole = () => {
    if (userRole === 'admin') {
      setUserRole('user');
    } else if (userRole === 'user') {
      setUserRole('guest');
    } else {
      setUserRole('admin');
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
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
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
                <NavigationMenuContent>
                  <div className="grid grid-cols-1 gap-1 p-2 w-48">
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
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden md:flex gap-1"
              onClick={() => handleNavigation('/submit-content')}
            >
              <Upload className="h-4 w-4" />
              Submit
            </Button>

            {isAdmin && (
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

            {/* Demo only - role switcher */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleRole} 
              title={`Current role: ${userRole} (click to change)`}
              className="rounded-full hover:bg-background/80 hidden md:flex"
            >
              <span className={`h-3 w-3 rounded-full ${
                userRole === 'admin' ? 'bg-red-500' : 
                userRole === 'user' ? 'bg-green-500' : 'bg-blue-500'
              }`}></span>
            </Button>

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

            <Button 
              className="hidden md:flex backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
              onClick={() => handleNavigation('/get-started')}
            >
              Get Started
            </Button>

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

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 flex items-center justify-center gap-2"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleNavigation('/submit-content');
                }}
              >
                <Upload className="h-4 w-4" />
                Submit Content
              </Button>

              {isAdmin && (
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
                <Button 
                  className="w-full backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
                  onClick={() => handleNavigation('/get-started')}
                >
                  Get Started
                </Button>
                
                {/* Role switcher (Demo only) */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current role:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleRole}
                    className="flex items-center gap-2"
                  >
                    <span className={`h-2 w-2 rounded-full ${
                      userRole === 'admin' ? 'bg-red-500' : 
                      userRole === 'user' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></span>
                    <span className="capitalize">{userRole}</span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </header>
  );
};

export default Header;
