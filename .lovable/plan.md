
# Plan: Fix Appearance and Quality Settings Functionality

## Issues Identified

### Issue 1: Appearance Settings Not Applied
The `AppearanceContext` sets CSS variables (`--interface-opacity`, `--sidebar-opacity`, `--cards-opacity`) and a `data-atmosphere` attribute, but these are **never consumed** by any CSS rules or components. The variables exist but have no effect on the UI.

### Issue 2: Quality Settings Not Syncing Across Components
The `useDeviceCapability` hook stores `performanceMode` in localStorage and updates its own state, but each component creates its own hook instance with independent state. When the SettingsDialog changes the mode, other components don't re-render because they have their own separate state.

---

## Solution

### Part 1: Make Appearance Settings Actually Work

**File: `src/index.css`**

Add CSS rules that consume the opacity and atmosphere CSS variables:

```css
/* Opacity Variables Application */
.glass-card {
  background: rgba(255, 255, 255, calc(var(--cards-opacity, 0.95)));
}

.dark .glass-card {
  background: rgba(0, 0, 0, calc(var(--cards-opacity, 0.95) * 0.4));
}

/* Sidebar opacity */
[data-sidebar] {
  background: rgba(255, 255, 255, var(--sidebar-opacity, 0.9)) !important;
}

.dark [data-sidebar] {
  background: rgba(0, 0, 0, calc(var(--sidebar-opacity, 0.9) * 0.8)) !important;
}

/* Interface (header/navbar) opacity */
header, nav, .navbar {
  background: rgba(255, 255, 255, var(--interface-opacity, 0.85)) !important;
}

/* Atmosphere Modes */
[data-atmosphere="solid"] body {
  background: hsl(var(--background)) !important;
}

[data-atmosphere="flow"] .liquid-blob {
  opacity: 0.3;
}

[data-atmosphere="aero"] .liquid-blob {
  opacity: 0.5;
  filter: blur(80px);
}

[data-atmosphere="aero"] .glass,
[data-atmosphere="aero"] .glass-card {
  backdrop-filter: blur(20px);
}
```

**File: `src/components/LiquidBackground.tsx`**

Update to respect atmosphere mode:

```tsx
import { useAppearance } from '@/contexts/AppearanceContext';

// Inside component:
const { settings } = useAppearance();

// Don't render blobs in "solid" mode
if (settings.atmosphereMode === 'solid') {
  return null;
}

// Adjust blob opacity based on atmosphere
const blobOpacity = settings.atmosphereMode === 'aero' ? 0.5 : 0.3;
```

**File: `src/components/StaticBackground.tsx`**

Update to respect atmosphere mode:

```tsx
import { useAppearance } from '@/contexts/AppearanceContext';

// Adjust gradient intensity based on atmosphere
```

---

### Part 2: Convert Quality Settings to React Context

**File: `src/contexts/DeviceCapabilityContext.tsx`** (NEW)

Create a context that wraps the device capability logic so all components share the same state:

```tsx
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

export type PerformanceMode = 'auto' | 'high-quality' | 'performance';

interface DeviceCapabilityContextType {
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

const DeviceCapabilityContext = createContext<DeviceCapabilityContextType | undefined>(undefined);

export const DeviceCapabilityProvider = ({ children }: { children: ReactNode }) => {
  const [performanceMode, setPerformanceModeState] = useState<PerformanceMode>(() => {
    const stored = localStorage.getItem('app_performance_mode');
    if (stored === 'high-quality' || stored === 'performance') return stored;
    return 'auto';
  });
  
  // ... rest of capability detection logic
  
  const setPerformanceMode = useCallback((mode: PerformanceMode) => {
    setPerformanceModeState(mode);
    localStorage.setItem('app_performance_mode', mode);
  }, []);
  
  return (
    <DeviceCapabilityContext.Provider value={capability}>
      {children}
    </DeviceCapabilityContext.Provider>
  );
};

export const useDeviceCapability = () => {
  const context = useContext(DeviceCapabilityContext);
  if (!context) {
    throw new Error('useDeviceCapability must be used within DeviceCapabilityProvider');
  }
  return context;
};
```

**File: `src/App.tsx`**

Wrap the app with the new provider:

```tsx
import { DeviceCapabilityProvider } from './contexts/DeviceCapabilityContext';

// Inside return:
<DeviceCapabilityProvider>
  <AppearanceProvider>
    {/* ... rest of app */}
  </AppearanceProvider>
</DeviceCapabilityProvider>
```

**File: `src/hooks/useDeviceCapability.ts`**

Update to re-export from context:

```tsx
export { useDeviceCapability, type PerformanceMode } from '@/contexts/DeviceCapabilityContext';
```

---

### Part 3: Apply Opacity to Key Components

**File: `src/components/Header.tsx`**

Apply interface opacity:

```tsx
const { settings } = useAppearance();

// In header className:
style={{ backgroundColor: `rgba(255, 255, 255, ${settings.interfaceOpacity / 100})` }}
```

**File: `src/components/ui/sidebar.tsx`**

Apply sidebar opacity:

```tsx
const { settings } = useAppearance();

// In sidebar className or style
style={{ backgroundColor: `rgba(255, 255, 255, ${settings.sidebarOpacity / 100})` }}
```

**File: `src/components/ui/card.tsx`**

Apply cards opacity:

```tsx
const { settings } = useAppearance();

// In Card className or add a wrapper that respects the opacity
```

---

## Summary of Changes

| File | Action | Purpose |
|------|--------|---------|
| `src/contexts/DeviceCapabilityContext.tsx` | Create | Shared state for quality settings |
| `src/hooks/useDeviceCapability.ts` | Modify | Re-export from context |
| `src/index.css` | Modify | Add CSS that uses opacity/atmosphere variables |
| `src/components/LiquidBackground.tsx` | Modify | Respect atmosphere mode |
| `src/components/StaticBackground.tsx` | Modify | Respect atmosphere mode |
| `src/components/Header.tsx` | Modify | Apply interface opacity |
| `src/components/ui/sidebar.tsx` | Modify | Apply sidebar opacity |
| `src/App.tsx` | Modify | Wrap with DeviceCapabilityProvider |
| `src/components/settings/SettingsDialog.tsx` | Minor update | Add toast feedback on appearance changes |

---

## Technical Notes

### How Opacity Will Work
- CSS variables are set on `:root` by AppearanceContext
- Components read from the context and apply inline styles or CSS uses the variables
- Changes propagate immediately as React state updates

### How Quality Mode Will Work
- Single source of truth in DeviceCapabilityContext
- All components share the same context value
- When mode changes, all consumers re-render automatically

### How Atmosphere Will Work
- `solid`: No animated blobs, pure solid background
- `flow`: Animated liquid blobs with subtle opacity (default)
- `aero`: More prominent blobs with extra blur effects

