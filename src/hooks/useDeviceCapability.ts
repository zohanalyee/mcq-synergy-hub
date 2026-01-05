import { useState, useEffect, useMemo } from 'react';

export interface DeviceCapability {
  isHighEnd: boolean;
  isLowEnd: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
  isTouchDevice: boolean;
  cpuCores: number;
}

export const useDeviceCapability = (): DeviceCapability => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

    // Determine device capability tier
    // Low-end: mobile, tablet, touch device, reduced motion preference, or < 4 cores
    const isLowEnd = isMobile || isTablet || isTouchDevice || prefersReducedMotion || cpuCores < 4;
    
    // High-end: desktop, non-touch, no reduced motion, >= 4 cores
    const isHighEnd = isDesktop && !isTouchDevice && !prefersReducedMotion && cpuCores >= 4;

    return {
      isHighEnd,
      isLowEnd,
      isMobile,
      isTablet,
      isDesktop,
      prefersReducedMotion,
      isTouchDevice,
      cpuCores,
    };
  }, [windowWidth]);

  return capability;
};
