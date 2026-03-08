import { Palette, Monitor, Layout, CreditCard, Sparkles, RotateCcw, Droplets, Globe, Cloud, CloudOff } from 'lucide-react';
import { useAppearance, AccentColor, AtmosphereMode, ColorMix, mixLibrary } from '@/contexts/AppearanceContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import LivePreviewCard from './LivePreviewCard';

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
  { id: 'flow', icon: <span className="text-sm">☽</span>, label: 'Flow', description: 'Subtle motion' },
  { id: 'aero', icon: <span className="text-sm">◇</span>, label: 'Aero', description: 'Full effects' },
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
    saveAsGlobal,
    isUsingCustom,
    isCloudSyncing,
  } = useAppearance();

  const { isAdmin } = useUserRole();

  const handleOpacityChange = (type: 'interface' | 'sidebar' | 'cards', value: number) => {
    switch (type) {
      case 'interface': updateInterfaceOpacity(value); break;
      case 'sidebar': updateSidebarOpacity(value); break;
      case 'cards': updateCardsOpacity(value); break;
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
    <div className="space-y-3">
      {/* Sync Status Indicator */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[10px]">
          {isCloudSyncing ? (
            <Cloud className="h-3 w-3 text-primary animate-pulse" />
          ) : isUsingCustom ? (
            <CloudOff className="h-3 w-3 text-amber-500" />
          ) : (
            <Globe className="h-3 w-3 text-emerald-500" />
          )}
          <span className="text-muted-foreground">
            {isCloudSyncing ? 'Syncing...' : isUsingCustom ? 'Custom Override' : 'Global Defaults'}
          </span>
        </div>
      </div>

      {/* Live Preview */}
      <LivePreviewCard />

      {/* Global Accent */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span>Global Accent</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => {
                updateAccentColor(color.id);
                toast.success(`Accent color changed to ${color.label}`);
              }}
              className={cn(
                "w-7 h-7 rounded-md transition-all",
                color.color,
                settings.accentColor === color.id
                  ? "ring-2 ring-offset-1 ring-primary scale-110"
                  : "hover:scale-105"
              )}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Opacity Sliders */}
      <div className="space-y-2.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Interface</span>
            </div>
            <span className="text-muted-foreground font-mono text-[10px]">{settings.interfaceOpacity}%</span>
          </div>
          <Slider value={[settings.interfaceOpacity]} onValueChange={([value]) => handleOpacityChange('interface', value)} min={0} max={100} step={1} className="cursor-pointer h-1.5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Layout className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Sidebar</span>
            </div>
            <span className="text-muted-foreground font-mono text-[10px]">{settings.sidebarOpacity}%</span>
          </div>
          <Slider value={[settings.sidebarOpacity]} onValueChange={([value]) => handleOpacityChange('sidebar', value)} min={0} max={100} step={1} className="cursor-pointer h-1.5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Cards</span>
            </div>
            <span className="text-muted-foreground font-mono text-[10px]">{settings.cardsOpacity}%</span>
          </div>
          <Slider value={[settings.cardsOpacity]} onValueChange={([value]) => handleOpacityChange('cards', value)} min={0} max={100} step={1} className="cursor-pointer h-1.5" />
        </div>
      </div>

      {/* Atmosphere Mode */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Atmosphere</span>
        </div>
        <div className="flex gap-0.5 p-0.5 bg-muted/50 rounded">
          {atmosphereModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                updateAtmosphereMode(mode.id);
                toast.success(`Atmosphere set to ${mode.label}`);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all",
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
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Droplets className="h-3.5 w-3.5 text-primary" />
          <span>Mix Library</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {colorMixPresets.map((preset) => {
            const colors = mixLibrary[preset.id];
            return (
              <button
                key={preset.id}
                onClick={() => handleColorMixChange(preset.id)}
                className={cn(
                  "relative p-1.5 rounded border transition-all overflow-hidden",
                  settings.colorMix === preset.id
                    ? "ring-1 ring-primary border-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }} />
                <div className="relative flex flex-col items-center gap-0.5">
                  <div className="flex -space-x-0.5">
                    {colors.map((color, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full border border-background" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="text-[8px] font-medium">{preset.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">Custom:</span>
          <div className="flex gap-1 flex-1">
            {settings.customMixColors.map((color, index) => (
              <input key={index} type="color" value={color} onChange={(e) => handleCustomColorChange(index as 0 | 1 | 2, e.target.value)} className="flex-1 h-5 rounded cursor-pointer border border-border" title={`Color ${index + 1}`} />
            ))}
          </div>
          <button
            onClick={() => handleColorMixChange('custom')}
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap",
              settings.colorMix === 'custom' ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Admin: Set as Global Default */}
      {isAdmin && (
        <Button
          variant="default"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={saveAsGlobal}
          disabled={isCloudSyncing}
        >
          <Globe className="h-3.5 w-3.5 mr-1.5" />
          Set as Global Default
        </Button>
      )}

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={resetToDefaults}
      >
        <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
        Reset to Global Defaults
      </Button>
    </div>
  );
};

export default AppearanceSettings;
