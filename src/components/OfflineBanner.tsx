import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Thin top banner when the browser goes offline while the app is open.
 * Imported eagerly (not lazy) so it still works with no network.
 */
const OfflineBanner = () => {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [backOnline, setBackOnline] = useState(false);

  useEffect(() => {
    let t: number | undefined;
    const down = () => { setOffline(true); setBackOnline(false); };
    const up = () => {
      setOffline(false); setBackOnline(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setBackOnline(false), 3000);
    };
    window.addEventListener('offline', down);
    window.addEventListener('online', up);
    return () => { window.removeEventListener('offline', down); window.removeEventListener('online', up); window.clearTimeout(t); };
  }, []);

  if (!offline && !backOnline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white ${offline ? 'bg-slate-800' : 'bg-emerald-600'}`}
    >
      {offline ? <WifiOff className="h-3.5 w-3.5" aria-hidden /> : <Wifi className="h-3.5 w-3.5" aria-hidden />}
      {offline ? "You're offline. Pages may not load until your internet is back." : 'Back online.'}
    </div>
  );
};

export default OfflineBanner;
