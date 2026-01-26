import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

export type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow';
export type AtmosphereMode = 'solid' | 'flow' | 'aero';
export type ColorMix = 'default' | 'sunset' | 'ocean' | 'forest' | 'custom';

interface AppearanceSettings {
  accentColor: AccentColor;
  interfaceOpacity: number;
  sidebarOpacity: number;
  cardsOpacity: number;
  atmosphereMode: AtmosphereMode;
  colorMix: ColorMix;
  customMixColors: [string, string, string];
}

interface AppearanceContextType {
  settings: AppearanceSettings;
  updateAccentColor: (color: AccentColor) => void;
  updateInterfaceOpacity: (opacity: number) => void;
  updateSidebarOpacity: (opacity: number) => void;
  updateCardsOpacity: (opacity: number) => void;
  updateAtmosphereMode: (mode: AtmosphereMode) => void;
  updateColorMix: (mix: ColorMix) => void;
  updateCustomMixColors: (colors: [string, string, string]) => void;
  resetToDefaults: () => void;
  getMixColors: () => [string, string, string];
}

const defaultSettings: AppearanceSettings = {
  accentColor: 'blue',
  interfaceOpacity: 85,
  sidebarOpacity: 90,
  cardsOpacity: 95,
  atmosphereMode: 'flow',
  colorMix: 'default',
  customMixColors: ['#8b5cf6', '#f472b6', '#38bdf8'],
};

// Mix Library presets
export const mixLibrary: Record<ColorMix, [string, string, string]> = {
  default: ['#8b5cf6', '#f472b6', '#38bdf8'], // Purple, Pink, Cyan
  sunset: ['#f97316', '#ec4899', '#8b5cf6'],  // Orange, Pink, Purple
  ocean: ['#06b6d4', '#3b82f6', '#8b5cf6'],   // Cyan, Blue, Purple
  forest: ['#22c55e', '#14b8a6', '#06b6d4'],  // Green, Teal, Cyan
  custom: ['#8b5cf6', '#f472b6', '#38bdf8'],  // Will be overridden by customMixColors
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
    
    // Apply opacity settings as CSS variables (0-1 range)
    root.style.setProperty('--interface-opacity', `${s.interfaceOpacity / 100}`);
    root.style.setProperty('--sidebar-opacity', `${s.sidebarOpacity / 100}`);
    root.style.setProperty('--cards-opacity', `${s.cardsOpacity / 100}`);
    
    // Apply atmosphere mode
    root.setAttribute('data-atmosphere', s.atmosphereMode);
    
    // Apply mix colors as CSS variables
    const mixColors = s.colorMix === 'custom' ? s.customMixColors : mixLibrary[s.colorMix];
    root.style.setProperty('--mix-color-1', mixColors[0]);
    root.style.setProperty('--mix-color-2', mixColors[1]);
    root.style.setProperty('--mix-color-3', mixColors[2]);
  };

  const getMixColors = useCallback((): [string, string, string] => {
    return settings.colorMix === 'custom' 
      ? settings.customMixColors 
      : mixLibrary[settings.colorMix];
  }, [settings.colorMix, settings.customMixColors]);

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

  const updateColorMix = (mix: ColorMix) => {
    setSettings(prev => ({ ...prev, colorMix: mix }));
  };

  const updateCustomMixColors = (colors: [string, string, string]) => {
    setSettings(prev => ({ ...prev, customMixColors: colors, colorMix: 'custom' }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    toast.success('Appearance reset to defaults');
  };

  return (
    <AppearanceContext.Provider value={{
      settings,
      updateAccentColor,
      updateInterfaceOpacity,
      updateSidebarOpacity,
      updateCardsOpacity,
      updateAtmosphereMode,
      updateColorMix,
      updateCustomMixColors,
      resetToDefaults,
      getMixColors,
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
