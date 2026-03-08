import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'yellow';
export type AtmosphereMode = 'solid' | 'flow' | 'aero';
export type ColorMix = 'default' | 'sunset' | 'ocean' | 'forest' | 'custom';

export interface AppearanceSettings {
  accentColor: AccentColor;
  interfaceOpacity: number;
  sidebarOpacity: number;
  cardsOpacity: number;
  atmosphereMode: AtmosphereMode;
  colorMix: ColorMix;
  customMixColors: [string, string, string];
  interfaceScale: number;
  borderRadius: number;
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
  updateInterfaceScale: (scale: number) => void;
  updateBorderRadius: (radius: number) => void;
  resetToDefaults: () => void;
  getMixColors: () => [string, string, string];
  saveAsGlobal: () => Promise<void>;
  resetToGlobal: () => Promise<void>;
  isUsingCustom: boolean;
  isCloudSyncing: boolean;
}

export const defaultSettings: AppearanceSettings = {
  accentColor: 'blue',
  interfaceOpacity: 85,
  sidebarOpacity: 90,
  cardsOpacity: 95,
  atmosphereMode: 'flow',
  colorMix: 'default',
  customMixColors: ['#8b5cf6', '#f472b6', '#38bdf8'],
  interfaceScale: 100,
  borderRadius: 12,
};

export const mixLibrary: Record<ColorMix, [string, string, string]> = {
  default: ['#8b5cf6', '#f472b6', '#38bdf8'],
  sunset: ['#f97316', '#ec4899', '#8b5cf6'],
  ocean: ['#06b6d4', '#3b82f6', '#8b5cf6'],
  forest: ['#22c55e', '#14b8a6', '#06b6d4'],
  custom: ['#8b5cf6', '#f472b6', '#38bdf8'],
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

const applySettings = (s: AppearanceSettings) => {
  const root = document.documentElement;
  const colors = accentColorMap[s.accentColor];
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', colors.primaryForeground);
  root.style.setProperty('--interface-opacity', `${s.interfaceOpacity / 100}`);
  root.style.setProperty('--sidebar-opacity', `${s.sidebarOpacity / 100}`);
  root.style.setProperty('--cards-opacity', `${s.cardsOpacity / 100}`);
  root.style.setProperty('--interface-scale', `${s.interfaceScale / 100}`);
  root.style.setProperty('--radius', `${s.borderRadius}px`);
  root.setAttribute('data-atmosphere', s.atmosphereMode);
  const mixColors = s.colorMix === 'custom' ? s.customMixColors : mixLibrary[s.colorMix];
  root.style.setProperty('--mix-color-1', mixColors[0]);
  root.style.setProperty('--mix-color-2', mixColors[1]);
  root.style.setProperty('--mix-color-3', mixColors[2]);
};

export const AppearanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    const stored = localStorage.getItem('appearance-settings');
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
  });
  const [globalSettings, setGlobalSettings] = useState<AppearanceSettings | null>(null);
  const [isUsingCustom, setIsUsingCustom] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  // Fetch global + user settings on mount/auth change
  useEffect(() => {
    const loadCloudSettings = async () => {
      try {
        // Fetch global settings
        const { data: globalData } = await (supabase as any)
          .from('global_appearance_settings')
          .select('settings')
          .eq('key', 'default')
          .maybeSingle();

        const globalS = globalData?.settings
          ? { ...defaultSettings, ...(globalData.settings as Record<string, unknown>) } as AppearanceSettings
          : null;
        setGlobalSettings(globalS);

        if (user?.id) {
          // Fetch user override
          const { data: userData } = await supabase
            .from('user_appearance_settings')
            .select('settings')
            .eq('user_id', user.id)
            .maybeSingle();

          if (userData?.settings) {
            const userS = { ...defaultSettings, ...(userData.settings as Record<string, unknown>) } as AppearanceSettings;
            setSettings(userS);
            setIsUsingCustom(true);
            localStorage.setItem('appearance-settings', JSON.stringify(userS));
          } else if (globalS) {
            setSettings(globalS);
            setIsUsingCustom(false);
            localStorage.setItem('appearance-settings', JSON.stringify(globalS));
          }
        } else if (globalS) {
          // Not logged in, use global
          setSettings(globalS);
          setIsUsingCustom(false);
          localStorage.setItem('appearance-settings', JSON.stringify(globalS));
        }
      } catch (err) {
        console.error('Failed to load cloud appearance settings:', err);
      }
      initialLoadDone.current = true;
    };

    loadCloudSettings();
  }, [user?.id]);

  // Subscribe to global settings realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('global-appearance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'global_appearance_settings',
        filter: 'key=eq.default',
      }, (payload) => {
        const newGlobal = payload.new as { settings?: Record<string, unknown> };
        if (newGlobal?.settings) {
          const gs = { ...defaultSettings, ...newGlobal.settings } as AppearanceSettings;
          setGlobalSettings(gs);
          // If user has no custom override, apply new global
          setIsUsingCustom(prev => {
            if (!prev) {
              setSettings(gs);
              localStorage.setItem('appearance-settings', JSON.stringify(gs));
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Apply settings to DOM whenever they change
  useEffect(() => {
    localStorage.setItem('appearance-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  // Debounced cloud save for user settings
  const saveToCloud = useCallback((newSettings: AppearanceSettings) => {
    if (!user?.id || !initialLoadDone.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setIsCloudSyncing(true);
      try {
        await (supabase as any)
          .from('user_appearance_settings')
          .upsert({
            user_id: user.id,
            settings: newSettings,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        setIsUsingCustom(true);
      } catch (err) {
        console.error('Failed to save appearance to cloud:', err);
      }
      setIsCloudSyncing(false);
    }, 1500);
  }, [user?.id]);

  const updateSetting = useCallback(<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  const updateAccentColor = (color: AccentColor) => updateSetting('accentColor', color);
  const updateInterfaceOpacity = (opacity: number) => updateSetting('interfaceOpacity', opacity);
  const updateSidebarOpacity = (opacity: number) => updateSetting('sidebarOpacity', opacity);
  const updateCardsOpacity = (opacity: number) => updateSetting('cardsOpacity', opacity);
  const updateAtmosphereMode = (mode: AtmosphereMode) => updateSetting('atmosphereMode', mode);
  const updateColorMix = (mix: ColorMix) => updateSetting('colorMix', mix);
  const updateInterfaceScale = (scale: number) => updateSetting('interfaceScale', scale);
  const updateBorderRadius = (radius: number) => updateSetting('borderRadius', radius);

  const updateCustomMixColors = (colors: [string, string, string]) => {
    setSettings(prev => {
      const next = { ...prev, customMixColors: colors, colorMix: 'custom' as ColorMix };
      saveToCloud(next);
      return next;
    });
  };

  const getMixColors = useCallback((): [string, string, string] => {
    return settings.colorMix === 'custom'
      ? settings.customMixColors
      : mixLibrary[settings.colorMix];
  }, [settings.colorMix, settings.customMixColors]);

  const saveAsGlobal = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      const { error } = await (supabase as any)
        .from('global_appearance_settings')
        .upsert({
          key: 'default',
          settings: settings,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) throw error;
      setGlobalSettings(settings);
      toast.success('Global appearance defaults updated!');
    } catch (err) {
      console.error('Failed to save global appearance:', err);
      toast.error('Failed to save global defaults');
    }
    setIsCloudSyncing(false);
  }, [settings, user?.id]);

  const resetToGlobal = useCallback(async () => {
    const target = globalSettings || defaultSettings;
    setSettings(target);
    setIsUsingCustom(false);
    localStorage.setItem('appearance-settings', JSON.stringify(target));

    if (user?.id) {
      try {
        await supabase
          .from('user_appearance_settings')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to delete user appearance override:', err);
      }
    }
    toast.success('Reset to global defaults');
  }, [globalSettings, user?.id]);

  const resetToDefaults = () => {
    resetToGlobal();
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
      updateInterfaceScale,
      updateBorderRadius,
      resetToDefaults,
      getMixColors,
      saveAsGlobal,
      resetToGlobal,
      isUsingCustom,
      isCloudSyncing,
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
