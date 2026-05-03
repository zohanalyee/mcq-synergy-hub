import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const KEY = 'mcqsai_upcoming_banner_dismissed_v1';

const UpcomingFreeBanner = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(localStorage.getItem(KEY) !== '1'); }, []);
  if (!show) return null;
  return (
    <div className="container mx-auto px-4 pt-3">
      <div className="relative rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 px-4 py-2.5 text-sm">
        <button
          aria-label="Dismiss"
          onClick={() => { localStorage.setItem(KEY, '1'); setShow(false); }}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-background/50 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-2 pr-6">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">🚀 Exciting Update Coming Soon!</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Currently 100 AI questions/day (Free) — soon <span className="font-medium text-foreground">unlimited AI questions</span>, still free. We're scaling up. 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingFreeBanner;
