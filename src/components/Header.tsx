
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
    { title: 'MCQs', path: '/mcqs' },
    { title: 'Quizzes', path: '/quizzes' },
    { title: 'Mock Tests', path: '/mock-tests' },
    { title: 'Custom Syllabus', path: '/custom-syllabus' },
    { title: 'Scholarships', path: '/scholarships' },
    { title: 'Jobs', path: '/jobs' },
    { title: 'Past Papers', path: '/past-papers' },
  ];

  const secondaryNavItems = [
    { title: 'Analytics', path: '/analytics' },
    { title: 'Feedback', path: '/feedback' },
    ...(isAdmin ? [{ title: 'Question Bank', path: '/question-bank' }] : []),
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
              className={`sticky top-0 z-40 transition-all duration-300 ${
                scrolled 
                  ? 'py-2 sm:py-3 glass backdrop-blur-md bg-background/60 border-b border-border/40 shadow-sm' 
                  : 'py-3 sm:py-4 bg-background/40'
              }`}
            >
              <div className="container px-4 mx-auto max-w-7xl">
                <div className="flex items-center justify-between gap-3 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/40 via-accent/30 to-primary-glow/40 hover:from-primary/60 hover:via-accent/50 hover:to-primary-glow/60 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] shadow-[0_0_15px_rgba(59,130,246,0.3)] group relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700" />
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
            <main className="flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Header;
