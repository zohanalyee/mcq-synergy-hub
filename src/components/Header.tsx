
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import HeaderLogo from './header/HeaderLogo';
import DesktopNavigation from './header/DesktopNavigation';
import HeaderActions from './header/HeaderActions';
import MobileMenu from './header/MobileMenu';

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
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'py-2 sm:py-3 glass backdrop-blur-md bg-background/60 border-b border-border/40 shadow-sm' 
          : 'py-3 sm:py-4 bg-transparent'
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <HeaderLogo onNavigate={handleNavigation} />

          <div className="flex-1 flex justify-center">
            <DesktopNavigation 
              navItems={navItems}
              secondaryNavItems={secondaryNavItems}
              isActive={isActive}
              onNavigate={handleNavigation}
            />
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
    </header>
  );
};

export default Header;
