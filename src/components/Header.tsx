
import { useState, useEffect } from 'react';
import { Laptop, Menu, Moon, Sun, X, LogIn, UserPlus, BookOpen, User, LogOut, Settings } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  theme?: string;
  setTheme?: (theme: string) => void;
}

const Header = ({ theme, setTheme }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Mock authentication state
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

  // Simulate checking auth state on component mount
  useEffect(() => {
    // For demo purposes, we'll check localStorage
    // In a real app, this would be connected to your auth system
    const userSession = localStorage.getItem('userSession');
    setIsAuthenticated(!!userSession);
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

  // Mock user data
  const userData = {
    name: "Alex Johnson",
    email: "alex.j@example.com",
    role: "Free User",
    avatarUrl: "", // Add a URL here for a real avatar image
  };

  const handleLogout = () => {
    // In a real app, implement proper logout logic
    localStorage.removeItem('userSession');
    setIsAuthenticated(false);
    handleNavigation('/');
  };

  // Mock login (for demonstration purposes)
  const handleMockLogin = () => {
    localStorage.setItem('userSession', JSON.stringify({ user: userData }));
    setIsAuthenticated(true);
    handleNavigation('/dashboard');
  };

  const navItems = [
    { title: 'Home', path: '/' },
    { title: 'Subjects', path: '/subjects' },
    { title: 'Mock Tests', path: '/mock-tests' },
    { title: 'Analytics', path: '/analytics' },
    { title: 'Leaderboard', path: '/leaderboard' },
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

            {/* Conditional rendering based on auth state */}
            {isAuthenticated ? (
              /* User is logged in - show user menu */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-10 w-10 p-0">
                    <Avatar>
                      <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {userData.name.charAt(0) + userData.name.split(' ')[1]?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium">{userData.name}</p>
                      <p className="text-xs text-muted-foreground">{userData.email}</p>
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary mt-1 w-fit">
                        {userData.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* User is not logged in - show sign in/up buttons */
              <>
                {/* For demonstration only - will be removed in a real app */}
                <Button
                  variant="ghost"
                  size="sm" 
                  className="hidden md:flex items-center gap-1"
                  onClick={handleMockLogin}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Demo Login
                </Button>
                
                {/* Sign In Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex items-center gap-1"
                  onClick={() => handleNavigation('/sign-in')}
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Button>

                {/* Sign Up Button */}
                <Button 
                  className="hidden md:flex items-center gap-1 backdrop-blur-sm bg-primary/80 hover:bg-primary/90" 
                  size="sm"
                  onClick={() => handleNavigation('/sign-up')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign Up
                </Button>
              </>
            )}

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
            
            {/* Mobile Menu Content - Different based on auth state */}
            <div className="flex flex-col p-4 space-y-4">
              {/* If authenticated, show user info at top of mobile menu */}
              {isAuthenticated && (
                <div className="flex items-center space-x-3 pb-3 border-b border-border/40">
                  <Avatar>
                    <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userData.name.charAt(0) + userData.name.split(' ')[1]?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userData.name}</p>
                    <p className="text-xs text-muted-foreground">{userData.role}</p>
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
              
              {/* Conditional rendering for mobile menu based on auth state */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full justify-start mt-4"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  {/* For demonstration only */}
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleMockLogin}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Demo Login
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/sign-in')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/sign-up')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Sign Up
                  </Button>
                </div>
              )}
              
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
