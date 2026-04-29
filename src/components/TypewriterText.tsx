import { useEffect, useRef, useState, memo } from 'react';
import { cn } from '@/lib/utils';

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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = prefersReducedMotion();
    if (reducedRef.current && phrases.length > 0) {
      setText(phrases[0]);
    }
  }, [phrases]);

  useEffect(() => {
    if (reducedRef.current || phrases.length === 0) return;

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
  }, [text, deleting, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseMs]);

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
      {!reducedRef.current && (
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
