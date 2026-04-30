import { Palette, Monitor, Layout, CreditCard, Sparkles, RotateCcw, Droplets, Globe, Cloud, CloudOff, Check, Settings2 } from 'lucide-react';
import { useAppearance, AccentColor, AtmosphereMode, ColorMix, mixLibrary } from '@/contexts/AppearanceContext';
import { useUserRole } from '@/contexts/UserRoleContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

// One-click ready-made themes — each bundles a color mix + matching accent.
const readyThemes: {
  id: Exclude<ColorMix, 'custom'>;
  label: string;
  tagline: string;
  accent: AccentColor;
}[] = [
  { id: 'default', label: 'Signature', tagline: 'Violet • Pink • Cyan', accent: 'purple' },
  { id: 'sunset',  label: 'Sunset',    tagline: 'Orange • Pink • Violet', accent: 'orange' },
  { id: 'ocean',   label: 'Ocean',     tagline: 'Cyan • Blue • Violet',   accent: 'blue' },
  { id: 'forest',  label: 'Forest',    tagline: 'Green • Teal • Cyan',    accent: 'green' },
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

  // One-click theme — applies the full premium combo so the user
  // never has to touch sliders or atmosphere settings.
  const applyTheme = (theme: typeof readyThemes[number]) => {
    updateColorMix(theme.id);
    updateAccentColor(theme.accent);
    updateAtmosphereMode('flow');
    updateInterfaceOpacity(80);
    updateSidebarOpacity(90);
    updateCardsOpacity(90);
    toast.success(`${theme.label} theme applied`);
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

      {/* Ready-made Themes — promoted to top */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Ready-made Themes</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {readyThemes.map((theme) => {
            const colors = mixLibrary[theme.id];
            const selected = settings.colorMix === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => applyTheme(theme)}
                className={cn(
                  "relative h-[72px] rounded-lg overflow-hidden border transition-all group text-left",
                  selected
                    ? "ring-2 ring-primary border-primary scale-[1.02] shadow-md"
                    : "border-border hover:border-primary/60 hover:scale-[1.01]"
                )}
                title={theme.tagline}
              >
                {/* Full gradient fill */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
                  }}
                />
                {/* Readability overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                {/* Selected check */}
                {selected && (
                  <div className="absolute top-1.5 right-1.5 bg-white/90 text-primary rounded-full p-0.5">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                )}
                {/* Label */}
                <div className="absolute bottom-1.5 left-2 right-2 text-white">
                  <div className="text-xs font-semibold leading-tight drop-shadow">{theme.label}</div>
                  <div className="text-[9px] opacity-90 leading-tight drop-shadow">{theme.tagline}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      <LivePreviewCard />

      {/* Accent color (kept visible — quick & visual) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span>Accent Color</span>
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

      {/* Advanced UI Controls — collapsed by default */}
      <Accordion type="single" collapsible className="border border-border/60 rounded-md">
        <AccordionItem value="advanced" className="border-0">
          <AccordionTrigger className="px-2.5 py-2 text-xs font-medium hover:no-underline">
            <div className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Advanced UI Controls</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2.5 pb-3 space-y-3">
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

            {/* Custom Mix Colors */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Droplets className="h-3.5 w-3.5 text-primary" />
                <span>Custom Mix</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {settings.customMixColors.map((color, index) => (
                    <input
                      key={index}
                      type="color"
                      value={color}
                      onChange={(e) => handleCustomColorChange(index as 0 | 1 | 2, e.target.value)}
                      className="flex-1 h-6 rounded cursor-pointer border border-border"
                      title={`Color ${index + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => {
                    updateColorMix('custom');
                    toast.success('Custom mix applied');
                  }}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded whitespace-nowrap font-medium",
                    settings.colorMix === 'custom'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  Apply
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
