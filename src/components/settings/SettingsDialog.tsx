import { Settings, Palette, Sparkles, Zap, Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppearanceSettings from './AppearanceSettings';
import { useDeviceCapability, PerformanceMode } from '@/hooks/useDeviceCapability';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { performanceMode, setPerformanceMode } = useDeviceCapability();
  const { toast } = useToast();

  const handleModeChange = (mode: PerformanceMode) => {
    setPerformanceMode(mode);
    
    const messages: Record<PerformanceMode, string> = {
      'auto': 'Auto mode enabled - Adjusting visuals based on your device',
      'high-quality': 'High quality mode enabled - Full visual effects active',
      'performance': 'Performance mode activated - Visuals reduced for speed',
    };
    
    toast({
      title: 'Visual Quality Updated',
      description: messages[mode],
    });
  };

  const qualityModes: { id: PerformanceMode; icon: React.ReactNode; label: string; description: string }[] = [
    { id: 'auto', icon: <Settings2 className="h-5 w-5" />, label: 'Auto', description: 'Detect device capability' },
    { id: 'high-quality', icon: <Sparkles className="h-5 w-5" />, label: 'High Quality', description: 'Full visual effects' },
    { id: 'performance', icon: <Zap className="h-5 w-5" />, label: 'Performance', description: 'Reduced for speed' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="appearance" className="flex items-center gap-1.5 text-xs">
              <Palette className="h-3.5 w-3.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="quality" className="flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Quality
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="mt-3">
            <AppearanceSettings />
          </TabsContent>
          
          <TabsContent value="quality" className="mt-3 space-y-3">
            <div className="text-center pb-1">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Visual Quality
              </h3>
            </div>
            
            <div className="space-y-1.5">
              {qualityModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2.5 rounded-md border transition-all text-left",
                    performanceMode === mode.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded",
                    performanceMode === mode.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {mode.icon}
                  </div>
                  <div>
                    <p className="font-medium text-xs">{mode.label}</p>
                    <p className="text-[10px] text-muted-foreground">{mode.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
