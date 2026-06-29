import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  /** Hide the wordmark and show only the logo icon. */
  iconOnly?: boolean;
}

/**
 * Non-interactive brand lockup (logo + MCQSAI wordmark) for use inside
 * modals/dialogs. Mirrors HeaderLogo styling but without the Link wrapper,
 * so global alerts share the same brand identity as the rest of the app.
 */
const BrandMark = ({ className, iconOnly = false }: BrandMarkProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gradient shadow-brand"
        aria-label="MCQSAI Logo"
      >
        <Brain className="h-4 w-4 text-white" aria-hidden="true" />
      </div>
      {!iconOnly && (
        <span
          className="text-lg whitespace-nowrap font-bold tracking-tight"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="text-brand-gradient">MCQS</span>
          <span className="text-foreground">AI</span>
        </span>
      )}
    </div>
  );
};

export default BrandMark;
