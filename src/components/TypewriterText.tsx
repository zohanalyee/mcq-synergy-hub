import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceCapability } from '@/contexts/DeviceCapabilityContext';

interface TypewriterTextProps {
  phrases: string[];
  prefix?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
  minHeightClass?: string;
  as?: keyof JSX.IntrinsicElements;
}

const TypewriterText = ({
  phrases,
  prefix = '',
  typeSpeed = 55,
  deleteSpeed = 30,
  pauseMs = 1600,
  className,
  cursorClassName,
  minHeightClass = 'min-h-[2.5em]',
  as: Tag = 'div',
}: TypewriterTextProps) => {
  // Pull from global DeviceCapabilityContext so the same low-end / reduced-motion
  // policy that disables LiquidBackground also short-circuits the typewriter loop.
  // Falls back gracefully if the provider is absent (e.g. during isolated tests).
  let isLowEnd = false;
  let prefersReducedMotion = false;
  try {
    const cap = useDeviceCapability();
    isLowEnd = cap.isLowEnd;
    prefersReducedMotion = cap.prefersReducedMotion;
  } catch {
    // No provider — fall back to a simple media query check
    prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }
  const skipAnimation = prefersReducedMotion || isLowEnd;

  const [text, setText] = useState(skipAnimation && phrases.length > 0 ? phrases[0] : '');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skipAnimation && phrases.length > 0) {
      setText(phrases[0]);
    }
  }, [phrases, skipAnimation]);

  useEffect(() => {
    if (skipAnimation || phrases.length === 0) return;

    const current = phrases[phraseIndex % phrases.length] ?? '';

    const tick = () => {
      if (document.visibilityState === 'hidden') {
        timerRef.current = setTimeout(tick, 500);
        return;
      }
      if (!deleting) {
        if (text.length < current.length) {
          setText(current.slice(0, text.length + 1));
        } else {
          timerRef.current = setTimeout(() => setDeleting(true), pauseMs);
          return;
        }
      } else {
        if (text.length > 0) {
          setText(current.slice(0, text.length - 1));
        } else {
          setDeleting(false);
          setPhraseIndex((i) => (i + 1) % phrases.length);
          return;
        }
      }
    };

    timerRef.current = setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, deleting, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseMs, skipAnimation]);

  return (
    <Tag
      className={cn(
        'block align-top whitespace-pre-wrap break-words',
        minHeightClass,
        className,
      )}
      aria-live="polite"
    >
      {prefix}
      <span>{text}</span>
      {!skipAnimation && (
        <span
          className={cn(
            'inline-block w-[1px] ml-0.5 align-middle bg-current animate-pulse',
            cursorClassName,
          )}
          style={{ height: '1em' }}
          aria-hidden="true"
        />
      )}
    </Tag>
  );
};

export default memo(TypewriterText);
