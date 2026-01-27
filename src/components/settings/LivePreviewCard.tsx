import { useAppearance, mixLibrary } from '@/contexts/AppearanceContext';
import { cn } from '@/lib/utils';

const LivePreviewCard = () => {
  const { settings, getMixColors } = useAppearance();
  const mixColors = getMixColors();
  
  // Calculate opacities
  const interfaceOpacity = settings.interfaceOpacity / 100;
  const sidebarOpacity = settings.sidebarOpacity / 100;
  const cardsOpacity = settings.cardsOpacity / 100;

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</span>
      
      <div 
        className="relative rounded-lg border border-border overflow-hidden h-32"
        style={{
          background: `linear-gradient(135deg, ${mixColors[0]}, ${mixColors[1]}, ${mixColors[2]})`,
        }}
      >
        {/* Animated blobs preview (only show in flow/aero modes) */}
        {settings.atmosphereMode !== 'solid' && (
          <>
            <div 
              className={cn(
                "absolute w-16 h-16 rounded-full animate-pulse",
                settings.atmosphereMode === 'aero' ? "opacity-50 blur-xl" : "opacity-30 blur-lg"
              )}
              style={{ 
                backgroundColor: mixColors[0],
                top: '10%',
                left: '10%',
              }}
            />
            <div 
              className={cn(
                "absolute w-12 h-12 rounded-full animate-pulse",
                settings.atmosphereMode === 'aero' ? "opacity-50 blur-xl" : "opacity-30 blur-lg"
              )}
              style={{ 
                backgroundColor: mixColors[1],
                bottom: '15%',
                right: '20%',
                animationDelay: '0.5s'
              }}
            />
          </>
        )}
        
        {/* Interface (header) preview */}
        <div 
          className="absolute top-0 left-0 right-0 h-6 border-b border-border/30 flex items-center px-2"
          style={{
            backgroundColor: `rgba(var(--interface-rgb), ${interfaceOpacity})`,
            backdropFilter: 'blur(8px)',
          }}
        >
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-warning/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        </div>
        <div className="ml-2 h-2 w-12 rounded bg-foreground/20" />
        </div>
        
        {/* Sidebar preview */}
        <div 
          className="absolute left-0 top-6 bottom-0 w-10 border-r border-border/30"
          style={{
            backgroundColor: `rgba(var(--sidebar-rgb), ${sidebarOpacity})`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="p-1.5 space-y-1.5 mt-1">
            <div className="w-full h-2 rounded bg-foreground/20" />
            <div className="w-full h-2 rounded bg-foreground/15" />
            <div className="w-full h-2 rounded bg-foreground/10" />
          </div>
        </div>
        
        {/* Cards preview */}
        <div className="absolute left-12 top-8 right-2 bottom-2 flex gap-1.5">
          <div 
            className="flex-1 rounded border border-border/30 p-1.5"
            style={{
              backgroundColor: `rgba(var(--card-rgb), ${cardsOpacity})`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="h-1.5 w-8 rounded bg-primary/60 mb-1" />
            <div className="h-1 w-full rounded bg-foreground/15" />
            <div className="h-1 w-3/4 rounded bg-foreground/10 mt-0.5" />
          </div>
          <div 
            className="flex-1 rounded border border-border/30 p-1.5"
            style={{
              backgroundColor: `rgba(var(--card-rgb), ${cardsOpacity})`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="h-1.5 w-6 rounded bg-accent/60 mb-1" />
            <div className="h-1 w-full rounded bg-foreground/15" />
            <div className="h-1 w-2/3 rounded bg-foreground/10 mt-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreviewCard;
