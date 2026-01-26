import { Palette, Monitor, Layout, CreditCard, Sparkles, RotateCcw, Droplets } from 'lucide-react';
import { useAppearance, AccentColor, AtmosphereMode, ColorMix, mixLibrary } from '@/contexts/AppearanceContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const accentColors: { id: AccentColor; color: string; label: string }[] = [
  { id: 'blue', color: 'bg-blue-500', label: 'Blue' },
  { id: 'green', color: 'bg-green-500', label: 'Green' },
  { id: 'purple', color: 'bg-purple-500', label: 'Purple' },
  { id: 'red', color: 'bg-red-500', label: 'Red' },
  { id: 'orange', color: 'bg-orange-500', label: 'Orange' },
  { id: 'yellow', color: 'bg-yellow-500', label: 'Yellow' },
];

const atmosphereModes: { id: AtmosphereMode; icon: React.ReactNode; label: string; description: string }[] = [
  { id: 'solid', icon: <Sparkles className="h-4 w-4" />, label: 'Solid', description: 'No animation' },
  { id: 'flow', icon: <span className="text-lg">☽</span>, label: 'Flow', description: 'Subtle motion' },
  { id: 'aero', icon: <span className="text-lg">◇</span>, label: 'Aero', description: 'Full effects' },
];

const colorMixPresets: { id: ColorMix; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
];

const AppearanceSettings = () => {
  const {
    settings,
    updateAccentColor,
    updateInterfaceOpacity,
    updateSidebarOpacity,
    updateCardsOpacity,
    updateAtmosphereMode,
    updateColorMix,
    updateCustomMixColors,
    resetToDefaults,
  } = useAppearance();

  const handleOpacityChange = (type: 'interface' | 'sidebar' | 'cards', value: number) => {
    switch (type) {
      case 'interface':
        updateInterfaceOpacity(value);
        break;
      case 'sidebar':
        updateSidebarOpacity(value);
        break;
      case 'cards':
        updateCardsOpacity(value);
        break;
    }
  };

  const handleColorMixChange = (mix: ColorMix) => {
    updateColorMix(mix);
    toast.success(`Color mix changed to ${mix}`);
  };

  const handleCustomColorChange = (index: 0 | 1 | 2, color: string) => {
    const newColors: [string, string, string] = [...settings.customMixColors] as [string, string, string];
    newColors[index] = color;
    updateCustomMixColors(newColors);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Appearance Engine
        </h3>
        <p className="text-xs text-muted-foreground mt-1">All changes are saved automatically</p>
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
              onClick={() => {
                updateAccentColor(color.id);
                toast.success(`Accent color changed to ${color.label}`);
              }}
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

      {/* Opacity Sliders - Full 0-100 range */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span>Interface</span>
            </div>
            <span className="text-muted-foreground font-mono text-xs">{settings.interfaceOpacity}%</span>
          </div>
          <Slider
            value={[settings.interfaceOpacity]}
            onValueChange={([value]) => handleOpacityChange('interface', value)}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Layout className="h-4 w-4 text-muted-foreground" />
              <span>Sidebar</span>
            </div>
            <span className="text-muted-foreground font-mono text-xs">{settings.sidebarOpacity}%</span>
          </div>
          <Slider
            value={[settings.sidebarOpacity]}
            onValueChange={([value]) => handleOpacityChange('sidebar', value)}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Cards</span>
            </div>
            <span className="text-muted-foreground font-mono text-xs">{settings.cardsOpacity}%</span>
          </div>
          <Slider
            value={[settings.cardsOpacity]}
            onValueChange={([value]) => handleOpacityChange('cards', value)}
            min={0}
            max={100}
            step={1}
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
              onClick={() => {
                updateAtmosphereMode(mode.id);
                toast.success(`Atmosphere set to ${mode.label}`);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                settings.atmosphereMode === mode.id
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={mode.description}
            >
              {mode.icon}
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Mix Library */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Droplets className="h-4 w-4 text-primary" />
          <span>Mix Library</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {colorMixPresets.map((preset) => {
            const colors = mixLibrary[preset.id];
            return (
              <button
                key={preset.id}
                onClick={() => handleColorMixChange(preset.id)}
                className={cn(
                  "relative p-3 rounded-lg border transition-all overflow-hidden",
                  settings.colorMix === preset.id
                    ? "ring-2 ring-primary border-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                {/* Gradient preview */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`
                  }}
                />
                <div className="relative flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border-2 border-background"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{preset.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Color Pickers */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Custom Mix</span>
            <button
              onClick={() => handleColorMixChange('custom')}
              className={cn(
                "text-xs px-2 py-1 rounded",
                settings.colorMix === 'custom'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              Use Custom
            </button>
          </div>
          <div className="flex gap-2">
            {settings.customMixColors.map((color, index) => (
              <div key={index} className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Color {index + 1}</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleCustomColorChange(index as 0 | 1 | 2, e.target.value)}
                  className="w-full h-8 rounded cursor-pointer border border-border"
                />
              </div>
            ))}
          </div>
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
