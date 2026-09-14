import { lazy, Suspense, useEffect, useState } from "react";

/**
 * Performance-only wrapper (no visual change).
 *
 * These global widgets are invisible on first paint (modals, listeners,
 * trackers, toast host, floating tools) but their modules used to be part of the
 * entry chunk, so React mounted them all inside one long startup task
 * (~478ms on throttled mobile). Here they are code-split and mounted in two
 * later, separate macrotasks so the main thread can yield between them.
 */
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const AIWelcome = lazy(() => import("./AIWelcome"));
const LibraryWelcome = lazy(() => import("./LibraryWelcome"));
const CampaignTracker = lazy(() => import("./CampaignTracker"));
const EmailPrefSync = lazy(() => import("./EmailPrefSync"));
const FloatingToolsRenderer = lazy(() => import("./tools/FloatingToolsRenderer"));
const GlobalCreditExhaustedListener = lazy(() => import("./credits/GlobalCreditExhaustedListener"));
const GuestResultCarryForward = lazy(() => import("./GuestResultCarryForward"));
const CookieConsent = lazy(() => import("./CookieConsent"));

const isPrerender = typeof window === "undefined" || (globalThis as any).__PRERENDER__;

/** Runs cb in a separate task once the browser is idle (with a hard deadline). */
function whenIdle(cb: () => void, timeout: number) {
  const ric = (window as any).requestIdleCallback as
    | ((c: () => void, o?: { timeout: number }) => number)
    | undefined;
  if (ric) return ric(cb, { timeout });
  const id = window.setTimeout(cb, Math.min(timeout, 200));
  return id;
}

const DeferredGlobals = () => {
  // Stage 1: toast host + interaction-critical listeners.
  // Stage 2: welcome modals, trackers, floating tools, cookie banner.
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (isPrerender) return;
    let cancelled = false;
    const t1 = whenIdle(() => {
      if (cancelled) return;
      setStage(1);
      whenIdle(() => {
        if (!cancelled) setStage(2);
      }, 1500);
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(t1 as number);
    };
  }, []);

  if (stage === 0) return null;

  return (
    <Suspense fallback={null}>
      <Sonner
        position="top-right"
        expand={true}
        closeButton={true}
        toastOptions={{ duration: 3000, style: { maxWidth: "400px" } }}
        visibleToasts={5}
      />
      <GlobalCreditExhaustedListener />
      <GuestResultCarryForward />
      {stage >= 2 && (
        <>
          <AIWelcome />
          <LibraryWelcome />
          <CampaignTracker />
          <EmailPrefSync />
          <FloatingToolsRenderer />
          <CookieConsent />
        </>
      )}
    </Suspense>
  );
};

export default DeferredGlobals;
