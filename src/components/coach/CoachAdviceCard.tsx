import { useEffect, useRef, useState } from "react";
import { Flame, AlertTriangle, Lightbulb, PartyPopper, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type CoachMood = "motivational" | "urgent" | "informative" | "celebratory" | "neutral";

interface CoachAdviceCardProps {
  advice: string;
  mood?: CoachMood;
  className?: string;
}

const MOOD_MAP: Record<CoachMood, { icon: typeof Sparkles; accent: string; ring: string; glow: string; label: string }> = {
  motivational: {
    icon: Flame,
    accent: "text-warning",
    ring: "border-warning/40",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--warning)/0.45)]",
    label: "Motivation",
  },
  urgent: {
    icon: AlertTriangle,
    accent: "text-destructive",
    ring: "border-destructive/40",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--destructive)/0.45)]",
    label: "Action needed",
  },
  informative: {
    icon: Lightbulb,
    accent: "text-info",
    ring: "border-info/40",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--info)/0.45)]",
    label: "Insight",
  },
  celebratory: {
    icon: PartyPopper,
    accent: "text-success",
    ring: "border-success/40",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--success)/0.45)]",
    label: "Well done",
  },
  neutral: {
    icon: Sparkles,
    accent: "text-primary",
    ring: "border-primary/30",
    glow: "shadow-[0_0_24px_-8px_hsl(var(--primary)/0.35)]",
    label: "Ustaad Ki Advice",
  },
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const CoachAdviceCard = ({ advice, mood = "neutral", className }: CoachAdviceCardProps) => {
  const config = MOOD_MAP[mood] ?? MOOD_MAP.neutral;
  const Icon = config.icon;
  const reduced = prefersReducedMotion();

  const [shown, setShown] = useState(reduced ? advice.length : 0);
  const [iconKey, setIconKey] = useState(mood);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typing reveal over the already-received string (CSS-light, one interval)
  useEffect(() => {
    if (reduced) {
      setShown(advice.length);
      return;
    }
    setShown(0);
    if (!advice) return;
    timerRef.current = setInterval(() => {
      setShown((prev) => {
        const next = prev + 3;
        if (next >= advice.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return advice.length;
        }
        return next;
      });
    }, 16);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advice, reduced]);

  // Crossfade the icon when the mood changes
  useEffect(() => {
    setIconKey(mood);
  }, [mood]);

  const skip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShown(advice.length);
  };

  const isTyping = shown < advice.length;

  return (
    <div
      onClick={skip}
      className={cn(
        "mx-4 mb-4 p-4 rounded-xl border bg-card/70 transition-all duration-500 animate-fade-in cursor-default",
        config.ring,
        config.glow,
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          key={iconKey}
          className={cn("w-4 h-4 shrink-0 animate-scale-in transition-colors duration-300", config.accent)}
          aria-hidden="true"
        />
        <span className={cn("text-xs font-semibold tracking-wide uppercase", config.accent)}>
          {config.label}
        </span>
      </div>
      <p
        className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap"
        aria-live="polite"
      >
        {advice.slice(0, shown)}
        {isTyping && (
          <span
            className="inline-block w-[2px] ml-0.5 align-middle bg-current animate-pulse"
            style={{ height: "1em" }}
            aria-hidden="true"
          />
        )}
      </p>
      {isTyping && (
        <p className="text-[11px] text-muted-foreground mt-2">Tap to show full advice</p>
      )}
    </div>
  );
};

export default CoachAdviceCard;
