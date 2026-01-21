import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearchDialog } from './GlobalSearchDialog';

export const GlobalSearchTrigger = () => {
  const [open, setOpen] = useState(false);

  // Register keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-9 gap-2 bg-white/60 dark:bg-background/60 backdrop-blur-sm border-border/50 hover:bg-white/80 dark:hover:bg-background/80 transition-all"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline text-muted-foreground">Search...</span>
        <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
