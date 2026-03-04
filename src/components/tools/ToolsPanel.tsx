import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ALL_TOOLS } from '@/data/toolsData';

const POPULAR_TOOLS = ALL_TOOLS.filter(t => t.popular).slice(0, 6);

export function ToolsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 px-2">
          <Wrench className="h-4 w-4" />
          <span className="hidden sm:inline">Tools</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
            {ALL_TOOLS.length}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Quick Tools
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {POPULAR_TOOLS.map(tool => (
            <Link
              key={tool.id}
              to={tool.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <tool.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="font-medium text-sm text-foreground">{tool.name}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Button asChild className="w-full" onClick={() => setOpen(false)}>
            <Link to="/tools">
              View All {ALL_TOOLS.length} Tools
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground">💡 Also try our free MCQ practice tests!</p>
          <Button asChild variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => setOpen(false)}>
            <Link to="/subjects">Explore MCQs →</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
