
import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import HeaderLogo from './header/HeaderLogo';
import HeaderActions from './header/HeaderActions';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { LiquidBackground } from './LiquidBackground';

const Header = ({ theme, setTheme, children }: { theme?: string; setTheme?: (theme: string) => void; children?: ReactNode }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { userRole, isAdmin } = useUserRole();
  const { user, profile, signOut } = useAuth();
  
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
    { title: 'Quizzes', path: '/quizzes' },
    { title: 'Mock Tests', path: '/mock-tests' },
    { title: 'Custom Syllabus', path: '/custom-syllabus' },
    { title: 'Scholarships', path: '/scholarships' },
  ];

  const secondaryNavItems = [
    { title: 'Analytics', path: '/analytics' },
    { title: 'Feedback', path: '/feedback' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <LiquidBackground speed={20} intensity={1} blobCount={5} />
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full relative">
          <AppSidebar 
            navItems={navItems}
            secondaryNavItems={secondaryNavItems}
            isActive={isActive}
            onNavigate={handleNavigation}
            isAdmin={isAdmin}
          />
          
          <div className="flex-1 flex flex-col w-full">
            <header 
              className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled 
                  ? 'py-2 glass backdrop-blur-xl bg-white/90 dark:bg-background/90 border-b border-white/30 dark:border-border/40 shadow-sm' 
                  : 'py-2 bg-white/70 dark:bg-background/60 backdrop-blur-md'
              }`}
            >
              <div className="container px-4 mx-auto max-w-7xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <SidebarTrigger className="h-9 w-9 rounded-lg bg-white/60 dark:bg-primary/20 hover:bg-white/80 dark:hover:bg-primary/30 backdrop-blur-sm border border-white/40 dark:border-primary/30 transition-all duration-300 hover:scale-105 shadow-sm" />
                    <HeaderLogo onNavigate={handleNavigation} />
                  </div>

                  <HeaderActions 
                    theme={theme}
                    user={user}
                    profile={profile}
                    isAdmin={isAdmin}
                    onToggleTheme={toggleTheme}
                    onNavigate={handleNavigation}
                    onSignOut={signOut}
                  />
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-x-hidden pb-mobile-nav mt-14">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Header;
