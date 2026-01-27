import { useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppearance } from '@/contexts/AppearanceContext';
import HeaderLogo from './header/HeaderLogo';
import HeaderActions from './header/HeaderActions';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { LiquidBackground } from './LiquidBackground';
import { StaticBackground } from './StaticBackground';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

const Header = ({ theme, setTheme, children }: { theme?: string; setTheme?: (theme: string) => void; children?: ReactNode }) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { userRole, isAdmin } = useUserRole();
  const { user, profile, signOut } = useAuth();
  const { isLowEnd } = useDeviceCapability();
  const { settings } = useAppearance();
  
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
    { title: 'Recruitment Tests', path: '/mock-tests' },
    { title: 'Jobs', path: '/jobs' },
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

  // Calculate interface opacity from settings
  const interfaceOpacityValue = settings.interfaceOpacity / 100;
  
  // Adaptive blur classes based on device capability
  const headerBlurClass = isLowEnd
    ? scrolled 
      ? 'border-b border-border/40 shadow-sm' 
      : ''
    : scrolled 
      ? 'glass backdrop-blur-xl border-b border-border/40 shadow-sm' 
      : 'backdrop-blur-md';

  // Force background remount when Mix Library / atmosphere changes.
  // This avoids any caching/optimization that may prevent visual updates.
  const backgroundKey = `${settings.atmosphereMode}-${settings.colorMix}-${settings.customMixColors.join('-')}`;

  return (
    <>
      {/* Adaptive background:
          - Low-end devices: static gradient
          - Solid atmosphere: static gradient (no blobs) so Mix Library still applies
          - Flow/Aero on capable devices: animated blobs
      */}
      {(isLowEnd || settings.atmosphereMode === 'solid')
        ? <StaticBackground key={backgroundKey} />
        : <LiquidBackground key={backgroundKey} speed={20} intensity={1} blobCount={5} />}
      <SidebarProvider defaultOpen={false}>
        <HeaderContent 
          navItems={navItems}
          secondaryNavItems={secondaryNavItems}
          isActive={isActive}
          handleNavigation={handleNavigation}
          isAdmin={isAdmin}
          headerBlurClass={headerBlurClass}
          interfaceOpacity={interfaceOpacityValue}
          theme={theme}
          user={user}
          profile={profile}
          onToggleTheme={toggleTheme}
          onSignOut={signOut}
        >
          {children}
        </HeaderContent>
      </SidebarProvider>
    </>
  );
};

// Separate component to use useSidebar hook inside SidebarProvider
const HeaderContent = ({ 
  navItems, 
  secondaryNavItems, 
  isActive, 
  handleNavigation, 
  isAdmin, 
  headerBlurClass, 
  interfaceOpacity,
  theme, 
  user, 
  profile, 
  onToggleTheme, 
  onSignOut,
  children 
}: {
  navItems: { title: string; path: string }[];
  secondaryNavItems: { title: string; path: string }[];
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
  isAdmin: boolean;
  headerBlurClass: string;
  interfaceOpacity: number;
  theme?: string;
  user: any;
  profile: any;
  onToggleTheme: () => void;
  onSignOut: () => Promise<void>;
  children?: React.ReactNode;
}) => {
  const { state, isMobile } = useSidebar();
  const isExpanded = state === 'expanded';
  
  // Calculate left offset based on sidebar state - only on desktop
  const sidebarExpandedWidth = 'var(--sidebar-width)';
  const sidebarCollapsedWidth = 'var(--sidebar-width-icon)';
  const headerLeft = isMobile ? '0' : (isExpanded ? sidebarExpandedWidth : sidebarCollapsedWidth);
  
  return (
    <div className="min-h-screen flex w-full relative">
      {/* Sidebar - Full height, flush to top-left */}
      <AppSidebar 
        navItems={navItems}
        secondaryNavItems={secondaryNavItems}
        isActive={isActive}
        onNavigate={handleNavigation}
        isAdmin={isAdmin}
      />
      
      <div className="flex-1 flex flex-col w-full">
        {/* Top Header Bar */}
        <header 
          className={`fixed top-0 right-0 z-40 h-14 flex items-center transition-all duration-300 ${headerBlurClass}`}
          style={{ 
            left: headerLeft,
            backgroundColor: `rgba(var(--interface-rgb), ${interfaceOpacity})`,
            backdropFilter: interfaceOpacity < 1 ? 'blur(12px)' : 'none',
          }}
        >
          <div className="px-4 w-full">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {/* Only show HeaderLogo when sidebar is collapsed OR on mobile */}
              {(!isExpanded || isMobile) && (
                <HeaderLogo onNavigate={handleNavigation} />
              )}
              <HeaderActions
                theme={theme}
                user={user}
                profile={profile}
                isAdmin={isAdmin}
                onToggleTheme={onToggleTheme}
                onNavigate={handleNavigation}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </header>
        
        {/* Main Content - Below header */}
        <main className="flex-1 overflow-x-hidden pb-mobile-nav mt-14">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Header;
