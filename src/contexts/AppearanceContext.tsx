import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow';
export type AtmosphereMode = 'solid' | 'flow' | 'aero';

interface AppearanceSettings {
  accentColor: AccentColor;
  interfaceOpacity: number;
  sidebarOpacity: number;
  cardsOpacity: number;
  atmosphereMode: AtmosphereMode;
}

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateAccentColor: (color: AccentColor) => void;
  updateInterfaceOpacity: (opacity: number) => void;
  updateSidebarOpacity: (opacity: number) => void;
  updateCardsOpacity: (opacity: number) => void;
  updateAtmosphereMode: (mode: AtmosphereMode) => void;
  resetToDefaults: () => void;
}

const defaultSettings: AppearanceSettings = {
  accentColor: 'blue',
  interfaceOpacity: 85,
  sidebarOpacity: 90,
  cardsOpacity: 95,
  atmosphereMode: 'flow',
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const accentColorMap: Record<AccentColor, { primary: string; primaryForeground: string }> = {
  blue: { primary: '221 83% 53%', primaryForeground: '210 40% 98%' },
  green: { primary: '142 71% 45%', primaryForeground: '355 100% 97%' },
  purple: { primary: '262 83% 58%', primaryForeground: '210 40% 98%' },
  red: { primary: '0 84% 60%', primaryForeground: '210 40% 98%' },
  orange: { primary: '25 95% 53%', primaryForeground: '210 40% 98%' },
  yellow: { primary: '45 93% 47%', primaryForeground: '210 40% 98%' },
};

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    const stored = localStorage.getItem('appearance-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('appearance-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (s: AppearanceSettings) => {
    const root = document.documentElement;
    
    // Apply accent color
    const colors = accentColorMap[s.accentColor];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    
    // Apply opacity settings as CSS variables
    root.style.setProperty('--interface-opacity', `${s.interfaceOpacity / 100}`);
    root.style.setProperty('--sidebar-opacity', `${s.sidebarOpacity / 100}`);
    root.style.setProperty('--cards-opacity', `${s.cardsOpacity / 100}`);
    
    // Apply atmosphere mode
    root.setAttribute('data-atmosphere', s.atmosphereMode);
  };

  const updateAccentColor = (color: AccentColor) => {
    setSettings(prev => ({ ...prev, accentColor: color }));
  };

  const updateInterfaceOpacity = (opacity: number) => {
    setSettings(prev => ({ ...prev, interfaceOpacity: opacity }));
  };

  const updateSidebarOpacity = (opacity: number) => {
    setSettings(prev => ({ ...prev, sidebarOpacity: opacity }));
  };

  const updateCardsOpacity = (opacity: number) => {
    setSettings(prev => ({ ...prev, cardsOpacity: opacity }));
  };

  const updateAtmosphereMode = (mode: AtmosphereMode) => {
    setSettings(prev => ({ ...prev, atmosphereMode: mode }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <AppearanceContext.Provider value={{
      settings,
      updateAccentColor,
      updateInterfaceOpacity,
      updateSidebarOpacity,
      updateCardsOpacity,
      updateAtmosphereMode,
      resetToDefaults,
    }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = (): AppearanceContextType => {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
};
