import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const KEY = 'mcqsai_upcoming_banner_dismissed_v1';

const UpcomingFreeBanner = () => {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(localStorage.getItem(KEY) !== '1'); }, []);
  if (!show) return null;
  return (
    <div className="container mx-auto px-4 pt-3">
      <div className="relative rounded-xl border border-white/20 bg-brand-gradient backdrop-blur-md px-4 py-2.5 text-sm text-white shadow-brand overflow-hidden">
        <div className="absolute inset-0 bg-background/10 pointer-events-none" />
        <button
          aria-label="Dismiss"
          onClick={() => { localStorage.setItem(KEY, '1'); setShow(false); }}
          className="absolute right-2 top-2 p-1 rounded-full hover:bg-white/20 text-white/80 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-start gap-2 pr-6">
          <Sparkles className="h-4 w-4 text-white mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-white">🚀 Exciting Update Coming Soon!</p>
            <p className="text-white/85 text-xs mt-0.5">
              Currently 100 AI questions/day (Free) — soon <span className="font-semibold text-white">unlimited AI questions</span>, still free. We're scaling up. 🎉
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingFreeBanner;
