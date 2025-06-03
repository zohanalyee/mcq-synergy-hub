
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
          <HeaderLogo onNavigate={handleNavigation} />

          {/* Spacer to push nav items to center */}
          <div className="flex-grow"></div>

          <DesktopNavigation 
            navItems={navItems}
            secondaryNavItems={secondaryNavItems}
            isActive={isActive}
            onNavigate={handleNavigation}
          />

          {/* Spacer to push actions to right */}
          <div className="flex-grow"></div>

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
