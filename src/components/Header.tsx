
import { useState, useEffect } from 'react';
import { Laptop, Menu, Moon, Sun, X, BookOpen, FileText, Briefcase, Award } from 'lucide-react';
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

const Header = ({ theme, setTheme }: { theme?: string; setTheme?: (theme: string) => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
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
    { title: 'Mock Tests', path: '/mock-tests' },
    { title: 'Analytics', path: '/analytics' },
    { title: 'Leaderboard', path: '/leaderboard' },
    { title: 'Past Papers', path: '/past-papers' },
    { title: 'Jobs', path: '/jobs' },
    { title: 'Scholarships', path: '/scholarships' },
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
            </NavigationMenuList>
          </NavigationMenu>

          {/* Spacer to push actions to right */}
          <div className="flex-grow"></div>

          {/* Action buttons with consistent spacing */}
          <div className="flex items-center gap-3 flex-shrink-0">
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
              
              <div className="pt-4 border-t border-border/40">
                <Button 
                  className="w-full backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
                  onClick={() => handleNavigation('/get-started')}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </header>
  );
};

export default Header;
