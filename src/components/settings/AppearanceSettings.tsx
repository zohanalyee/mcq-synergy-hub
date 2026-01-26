import { Palette, Monitor, Layout, CreditCard, Sparkles, RotateCcw } from 'lucide-react';
import { useAppearance, AccentColor, AtmosphereMode } from '@/contexts/AppearanceContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const accentColors: { id: AccentColor; color: string; label: string }[] = [
  { id: 'blue', color: 'bg-blue-500', label: 'Blue' },
  { id: 'green', color: 'bg-green-500', label: 'Green' },
  { id: 'purple', color: 'bg-purple-500', label: 'Purple' },
  { id: 'red', color: 'bg-red-500', label: 'Red' },
  { id: 'orange', color: 'bg-orange-500', label: 'Orange' },
  { id: 'yellow', color: 'bg-yellow-500', label: 'Yellow' },
];

const atmosphereModes: { id: AtmosphereMode; icon: React.ReactNode; label: string }[] = [
  { id: 'solid', icon: <Sparkles className="h-4 w-4" />, label: 'Solid' },
  { id: 'flow', icon: <span className="text-lg">☽</span>, label: 'Flow' },
  { id: 'aero', icon: <span className="text-lg">◇</span>, label: 'Aero' },
];

const AppearanceSettings = () => {
  const {
    settings,
    updateAccentColor,
    updateInterfaceOpacity,
    updateSidebarOpacity,
    updateCardsOpacity,
    updateAtmosphereMode,
    resetToDefaults,
  } = useAppearance();

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Appearance Engine
        </h3>
      </div>

      {/* Global Accent */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Palette className="h-4 w-4 text-primary" />
          <span>Global Accent</span>
        </div>
        <div className="flex gap-2">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => updateAccentColor(color.id)}
              className={cn(
                "w-9 h-9 rounded-lg transition-all",
                color.color,
                settings.accentColor === color.id
                  ? "ring-2 ring-offset-2 ring-primary scale-110"
                  : "hover:scale-105"
              )}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Opacity Sliders */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span>Interface</span>
            </div>
            <span className="text-muted-foreground">{settings.interfaceOpacity}%</span>
          </div>
          <Slider
            value={[settings.interfaceOpacity]}
            onValueChange={([value]) => updateInterfaceOpacity(value)}
            min={50}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <span>Sidebar</span>
            </div>
            <span className="text-muted-foreground">{settings.sidebarOpacity}%</span>
          </div>
          <Slider
            value={[settings.sidebarOpacity]}
            onValueChange={([value]) => updateSidebarOpacity(value)}
            min={50}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Cards</span>
            </div>
            <span className="text-muted-foreground">{settings.cardsOpacity}%</span>
          </div>
          <Slider
            value={[settings.cardsOpacity]}
            onValueChange={([value]) => updateCardsOpacity(value)}
            min={50}
            max={100}
            step={5}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Atmosphere Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Atmosphere</span>
        </div>
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          {atmosphereModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => updateAtmosphereMode(mode.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                settings.atmosphereMode === mode.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={resetToDefaults}
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Reset to Defaults
      </Button>
    </div>
  );
};

export default AppearanceSettings;
