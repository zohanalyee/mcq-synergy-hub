import React, { useMemo } from 'react';

interface RTLTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

/**
 * Automatically wraps English/number words in RTL text with <bdi dir="ltr">
 * to prevent bidirectional text overlap and broken flow in Urdu/Sindhi.
 */
const RTLText: React.FC<RTLTextProps> = ({ children, className = '', as: Component = 'span' }) => {
  const rendered = useMemo(() => {
    // Split on runs of Latin letters, digits, and common punctuation like hyphens/dots
    const parts = children.split(/([A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*)/g);

    return parts.map((part, i) => {
      if (/^[A-Za-z0-9]/.test(part)) {
        return (
          <bdi key={i} dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {part}
          </bdi>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }, [children]);

  return <Component className={className}>{rendered}</Component>;
};

export default RTLText;
