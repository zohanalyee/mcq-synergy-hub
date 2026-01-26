import React, { ReactNode } from 'react';
import { Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingToolWindowProps {
  id: string;
  title: string;
  icon: ReactNode;
  color: string;
  isMinimized: boolean;
  style?: React.CSSProperties;
  onMinimize: () => void;
  onClose: () => void;
  onFocus: () => void;
  children: ReactNode;
}

const FloatingToolWindow = ({
  id,
  title,
  icon,
  color,
  isMinimized,
  style,
  onMinimize,
  onClose,
  onFocus,
  children,
}: FloatingToolWindowProps) => {
  return (
    <div
      className={cn(
        "fixed z-50 bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-xl shadow-2xl border border-border/50 overflow-hidden transition-all duration-200",
        isMinimized ? "w-48" : "w-80 max-h-[70vh]"
      )}
      style={style}
      onClick={onFocus}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b bg-muted/30 cursor-move select-none"
        style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="font-medium text-sm truncate">{title}</span>
        </div>
        <div className="flex gap-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-muted rounded-md" 
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive rounded-md" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content - hidden when minimized */}
      {!isMinimized && (
        <div className="p-3 overflow-y-auto max-h-[calc(70vh-40px)]">
          {children}
        </div>
      )}
    </div>
  );
};

export default FloatingToolWindow;
