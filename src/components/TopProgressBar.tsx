import { memo } from 'react';
import { Brain, Sparkles } from 'lucide-react';

/**
 * Lightweight Suspense fallback: brand logo centered + indeterminate
 * top progress bar driven by the global brand gradient tokens.
 */
const TopProgressBar = () => {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background">
      {/* Top indeterminate bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] z-[9999] overflow-hidden bg-muted/40">
        <div className="h-full w-1/3 rounded-r-full bg-brand-gradient animate-top-progress" />
      </div>

      {/* Centered brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-gradient shadow-brand">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <Sparkles className="h-4 w-4 text-brand-gradient animate-pulse" style={{ color: 'hsl(var(--brand-from))' }} />
        </div>
        <span
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="text-brand-gradient">MCQS</span>
          <span className="text-foreground">AI</span>
        </span>
        <p className="text-xs text-muted-foreground">AI-Powered Exam Prep</p>
      </div>
    </div>
  );
};

export default memo(TopProgressBar);
