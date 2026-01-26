import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type PerformanceMode = 'auto' | 'high-quality' | 'performance';

export interface DeviceCapability {
  isHighEnd: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
  isTouchDevice: boolean;
  cpuCores: number;
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => void;
}

const STORAGE_KEY = 'app_performance_mode';

const DeviceCapabilityContext = createContext<DeviceCapability | undefined>(undefined);

const getStoredMode = (): PerformanceMode => {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'high-quality' || stored === 'performance') return stored;
  return 'auto';
};

export const DeviceCapabilityProvider = ({ children }: { children: ReactNode }) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [performanceMode, setPerformanceModeState] = useState<PerformanceMode>(getStoredMode);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setPerformanceMode = useCallback((mode: PerformanceMode) => {
    setPerformanceModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const capability = useMemo(() => {
    // Screen size detection
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    // Touch device detection
    const isTouchDevice = typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );

    // Reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // CPU cores (fallback to 4 if unavailable)
    const cpuCores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 4;

    // Auto-detected capability tier
    const autoIsLowEnd = isMobile || isTablet || isTouchDevice || prefersReducedMotion || cpuCores < 4;
    const autoIsHighEnd = isDesktop && !isTouchDevice && !prefersReducedMotion && cpuCores >= 4;

    // Apply manual override
    let isLowEnd = autoIsLowEnd;
    let isHighEnd = autoIsHighEnd;

    if (performanceMode === 'high-quality') {
      isLowEnd = false;
      isHighEnd = true;
    } else if (performanceMode === 'performance') {
      isLowEnd = true;
      isHighEnd = false;
    }

    return {
      isHighEnd,
      isLowEnd,
      isMobile,
      isTablet,
      isDesktop,
      prefersReducedMotion,
      isTouchDevice,
      cpuCores,
      performanceMode,
      setPerformanceMode,
    };
  }, [windowWidth, performanceMode, setPerformanceMode]);

  return (
    <DeviceCapabilityContext.Provider value={capability}>
      {children}
    </DeviceCapabilityContext.Provider>
  );
};

export const useDeviceCapability = (): DeviceCapability => {
  const context = useContext(DeviceCapabilityContext);
  if (context === undefined) {
    throw new Error('useDeviceCapability must be used within a DeviceCapabilityProvider');
  }
  return context;
};
