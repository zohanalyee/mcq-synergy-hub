
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import HeaderLogo from './header/HeaderLogo';
import HeaderActions from './header/HeaderActions';
import MobileMenu from './header/MobileMenu';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

const Header = ({ theme, setTheme }: { theme?: string; setTheme?: (theme: string) => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
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
                    <SidebarTrigger className="lg:flex" />
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
                    onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
                  />
                </div>
              </div>
            </header>
          </div>
        </div>
      </SidebarProvider>

      <MobileMenu 
        isOpen={isMobileMenuOpen}
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        navItems={navItems}
        secondaryNavItems={secondaryNavItems}
        isActive={isActive}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={handleNavigation}
        onSignOut={signOut}
      />
    </>
  );
};

export default Header;
