import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionText: string;
  themeColor: string;
  pastelColor: string;
  /** Internal route — renders an <a href> via React Router <Link> for SEO + middle-click. */
  to?: string;
  /** External URL — renders a real <a href> with target=_blank. */
  href?: string;
  /** Optional react-router state when using `to`. */
  linkState?: unknown;
  /** Fallback for non-navigational click actions. Ignored if `to` or `href` is set. */
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  /** Accessible label for the link (defaults to title). */
  ariaLabel?: string;
}

const MotionLink = motion.create(Link);
const MotionA = motion.a;
const MotionDiv = motion.div;

export const GlassCard = ({
  title,
  subtitle,
  icon,
  actionText,
  themeColor,
  pastelColor,
  to,
  href,
  linkState,
  onClick,
  className,
  children,
  rightContent,
  ariaLabel,
}: GlassCardProps) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-5 h-5 text-white",
      });
    }
    return <BookOpen className="w-5 h-5 text-white" />;
  };

  const sharedMotionProps = {
    whileHover: { y: -3 },
    transition: { duration: 0.2, ease: "easeOut" as const },
    className: cn("cursor-pointer group h-full block", className),
    "aria-label": ariaLabel ?? title,
  };

  const inner = (
    <div
      className="h-full rounded-2xl p-3 border border-white/50 dark:border-white/20 shadow-sm 
                 hover:shadow-lg transition-all duration-300 flex flex-col min-h-[130px] themed-card glass-card"
      style={{
        background: `linear-gradient(135deg, ${pastelColor} 0%, rgba(var(--card-rgb), var(--cards-opacity, 0.95)) 100%)`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center mb-2 
                   group-hover:scale-105 transition-transform duration-200"
        style={{ backgroundColor: themeColor }}
      >
        {renderIcon()}
      </div>

      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-2 leading-tight">
        {title}
      </h3>
      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">
        {subtitle}
      </p>

      {children && <div className="flex-1 mb-2">{children}</div>}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[9px] font-bold uppercase tracking-wide"
            style={{ color: themeColor }}
          >
            {actionText}
          </span>
          {rightContent}
        </div>
        <motion.div
          className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm 
                     group-hover:shadow-md transition-shadow"
          style={{ backgroundColor: themeColor }}
          whileHover={{ rotate: -45 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowRight className="w-3 h-3 text-white" />
        </motion.div>
      </div>
    </div>
  );

  // Internal navigation → real <Link> renders <a href>
  if (to) {
    return (
      <MotionLink to={to} state={linkState as any} {...sharedMotionProps}>
        {inner}
      </MotionLink>
    );
  }

  // External navigation → real <a href>
  if (href) {
    return (
      <MotionA
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...sharedMotionProps}
      >
        {inner}
      </MotionA>
    );
  }

  // Fallback: action callback (no navigation)
  return (
    <MotionDiv onClick={onClick} {...sharedMotionProps}>
      {inner}
    </MotionDiv>
  );
};

// Color theme helper matching the GIF style
export const getCardTheme = (
  title: string,
  fallbackColor?: string
): { main: string; pastel: string } => {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("sindhi") ||
    lowerTitle.includes("urdu") ||
    lowerTitle.includes("arabic")
  ) {
    return { main: "#f59e0b", pastel: "rgba(245, 158, 11, 0.12)" };
  }
  if (
    lowerTitle.includes("islam") ||
    lowerTitle.includes("religious") ||
    lowerTitle.includes("ethics")
  ) {
    return { main: "#14b8a6", pastel: "rgba(20, 184, 166, 0.12)" };
  }
  if (
    lowerTitle.includes("biology") ||
    lowerTitle.includes("science") ||
    lowerTitle.includes("botany") ||
    lowerTitle.includes("zoology")
  ) {
    return { main: "#14b8a6", pastel: "rgba(20, 184, 166, 0.12)" };
  }
  if (lowerTitle.includes("english") || lowerTitle.includes("literature")) {
    return { main: "#0ea5e9", pastel: "rgba(14, 165, 233, 0.12)" };
  }
  if (
    lowerTitle.includes("math") ||
    lowerTitle.includes("statistics") ||
    lowerTitle.includes("calculus")
  ) {
    return { main: "#8b5cf6", pastel: "rgba(139, 92, 246, 0.12)" };
  }
  if (lowerTitle.includes("physics")) {
    return { main: "#a855f7", pastel: "rgba(168, 85, 247, 0.12)" };
  }
  if (lowerTitle.includes("chemistry")) {
    return { main: "#f43f5e", pastel: "rgba(244, 63, 94, 0.12)" };
  }
  if (
    lowerTitle.includes("computer") ||
    lowerTitle.includes("programming") ||
    lowerTitle.includes("cs") ||
    lowerTitle.includes("it")
  ) {
    return { main: "#10b981", pastel: "rgba(16, 185, 129, 0.12)" };
  }
  if (
    lowerTitle.includes("economics") ||
    lowerTitle.includes("business") ||
    lowerTitle.includes("commerce")
  ) {
    return { main: "#3b82f6", pastel: "rgba(59, 130, 246, 0.12)" };
  }
  if (lowerTitle.includes("job") || lowerTitle.includes("career")) {
    return { main: "#6366f1", pastel: "rgba(99, 102, 241, 0.12)" };
  }
  if (
    lowerTitle.includes("scholarship") ||
    lowerTitle.includes("grant") ||
    lowerTitle.includes("fellowship")
  ) {
    return { main: "#10b981", pastel: "rgba(16, 185, 129, 0.12)" };
  }
  if (
    lowerTitle.includes("government") ||
    lowerTitle.includes("federal") ||
    lowerTitle.includes("provincial")
  ) {
    return { main: "#f59e0b", pastel: "rgba(245, 158, 11, 0.12)" };
  }

  if (fallbackColor) {
    return {
      main: fallbackColor,
      pastel: `${fallbackColor}1F`,
    };
  }

  return { main: "#3b82f6", pastel: "rgba(59, 130, 246, 0.12)" };
};

export default GlassCard;
