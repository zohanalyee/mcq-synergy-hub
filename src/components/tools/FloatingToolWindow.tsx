import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Minus, X, GripHorizontal } from 'lucide-react';
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
  onRestore?: () => void;
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
  onRestore,
  children,
}: FloatingToolWindowProps) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);

  // Calculate initial position from style prop
  useEffect(() => {
    if (!position && style) {
      const right = typeof style.right === 'number' ? style.right : 16;
      const bottom = typeof style.bottom === 'number' ? style.bottom : 80;
      // Convert right/bottom to x/y (left/top)
      const x = window.innerWidth - right - (isMinimized ? 192 : 320);
      const y = window.innerHeight - bottom - (isMinimized ? 40 : 300);
      setPosition({ x: Math.max(0, x), y: Math.max(0, y) });
    }
  }, [style, position, isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onFocus();
    
    const rect = dragRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragStartRef.current = {
      x: position?.x ?? rect.left,
      y: position?.y ?? rect.top,
      startX: e.clientX,
      startY: e.clientY,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      
      const newX = dragStartRef.current.x + deltaX;
      const newY = dragStartRef.current.y + deltaY;
      
      // Constrain to viewport
      const maxX = window.innerWidth - (isMinimized ? 192 : 320);
      const maxY = window.innerHeight - 40;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  const handleHeaderClick = () => {
    if (isMinimized && onRestore) {
      onRestore();
    }
  };

  const windowStyle: React.CSSProperties = position
    ? { left: position.x, top: position.y }
    : style;

  return (
    <div
      ref={dragRef}
      className={cn(
        "fixed z-50 bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-xl shadow-2xl border border-border/50 overflow-hidden transition-[width] duration-200",
        isMinimized ? "w-48" : "w-80 max-h-[70vh]",
        isDragging && "cursor-grabbing select-none"
      )}
      style={windowStyle}
      onClick={onFocus}
    >
      {/* Header - Draggable */}
      <div 
        className={cn(
          "flex items-center justify-between px-3 py-2 border-b bg-muted/30 select-none",
          isMinimized ? "cursor-pointer hover:bg-muted/50" : "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        style={{ borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
        onMouseDown={handleMouseDown}
        onClick={handleHeaderClick}
      >
        <div className="flex items-center gap-2">
          {!isMinimized && <GripHorizontal className="h-3 w-3 text-muted-foreground" />}
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
