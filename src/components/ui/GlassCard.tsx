import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  actionText: string;
  themeColor: string;
  pastelColor: string;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const GlassCard = ({
  title,
  subtitle,
  icon,
  actionText,
  themeColor,
  pastelColor,
  onClick,
  className,
  children,
  rightContent,
}: GlassCardProps) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-5 h-5 text-white",
      });
    }
    return <BookOpen className="w-5 h-5 text-white" />;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn("cursor-pointer group h-full", className)}
      onClick={onClick}
    >
      <div
        className="h-full rounded-3xl p-4 border border-white/50 dark:border-white/20 shadow-sm 
                   hover:shadow-xl transition-all duration-300 flex flex-col min-h-[160px]"
        style={{
          background: `linear-gradient(135deg, ${pastelColor} 0%, rgba(255, 255, 255, 0.95) 100%)`,
        }}
      >
        {/* Icon Squircle - Top Left */}
        <div
          className="w-11 h-11 rounded-2xl shadow-md flex items-center justify-center mb-3 
                     group-hover:scale-105 transition-transform duration-200"
          style={{ backgroundColor: themeColor }}
        >
          {renderIcon()}
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {subtitle}
        </p>

        {/* Optional children content */}
        {children && <div className="flex-1 mb-3">{children}</div>}

        {/* Action Row - Bottom */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: themeColor }}
            >
              {actionText}
            </span>
            {rightContent}
          </div>
          <motion.div
            className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm 
                       group-hover:shadow-md transition-shadow"
            style={{ backgroundColor: themeColor }}
            whileHover={{ rotate: -45 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Color theme helper matching the GIF style
export const getCardTheme = (
  title: string,
  fallbackColor?: string
): { main: string; pastel: string } => {
  const lowerTitle = title.toLowerCase();

  // Language subjects - Orange/Amber (like Sindhi in GIF)
  if (
    lowerTitle.includes("sindhi") ||
    lowerTitle.includes("urdu") ||
    lowerTitle.includes("arabic")
  ) {
    return { main: "#f59e0b", pastel: "rgba(245, 158, 11, 0.12)" };
  }

  // Religious/Islamic studies - Teal (like Islamiat in GIF)
  if (
    lowerTitle.includes("islam") ||
    lowerTitle.includes("religious") ||
    lowerTitle.includes("ethics")
  ) {
    return { main: "#14b8a6", pastel: "rgba(20, 184, 166, 0.12)" };
  }

  // Biology/Science - Teal/Emerald
  if (
    lowerTitle.includes("biology") ||
    lowerTitle.includes("science") ||
    lowerTitle.includes("botany") ||
    lowerTitle.includes("zoology")
  ) {
    return { main: "#14b8a6", pastel: "rgba(20, 184, 166, 0.12)" };
  }

  // English - Sky Blue
  if (lowerTitle.includes("english") || lowerTitle.includes("literature")) {
    return { main: "#0ea5e9", pastel: "rgba(14, 165, 233, 0.12)" };
  }

  // Math - Violet/Indigo
  if (
    lowerTitle.includes("math") ||
    lowerTitle.includes("statistics") ||
    lowerTitle.includes("calculus")
  ) {
    return { main: "#8b5cf6", pastel: "rgba(139, 92, 246, 0.12)" };
  }

  // Physics - Purple
  if (lowerTitle.includes("physics")) {
    return { main: "#a855f7", pastel: "rgba(168, 85, 247, 0.12)" };
  }

  // Chemistry - Rose
  if (lowerTitle.includes("chemistry")) {
    return { main: "#f43f5e", pastel: "rgba(244, 63, 94, 0.12)" };
  }

  // Computer Science - Emerald
  if (
    lowerTitle.includes("computer") ||
    lowerTitle.includes("programming") ||
    lowerTitle.includes("cs") ||
    lowerTitle.includes("it")
  ) {
    return { main: "#10b981", pastel: "rgba(16, 185, 129, 0.12)" };
  }

  // Economics/Business - Blue
  if (
    lowerTitle.includes("economics") ||
    lowerTitle.includes("business") ||
    lowerTitle.includes("commerce")
  ) {
    return { main: "#3b82f6", pastel: "rgba(59, 130, 246, 0.12)" };
  }

  // Jobs - Indigo
  if (lowerTitle.includes("job") || lowerTitle.includes("career")) {
    return { main: "#6366f1", pastel: "rgba(99, 102, 241, 0.12)" };
  }

  // Scholarships - Emerald/Green
  if (
    lowerTitle.includes("scholarship") ||
    lowerTitle.includes("grant") ||
    lowerTitle.includes("fellowship")
  ) {
    return { main: "#10b981", pastel: "rgba(16, 185, 129, 0.12)" };
  }

  // Government - Amber/Orange
  if (
    lowerTitle.includes("government") ||
    lowerTitle.includes("federal") ||
    lowerTitle.includes("provincial")
  ) {
    return { main: "#f59e0b", pastel: "rgba(245, 158, 11, 0.12)" };
  }

  // Default: use fallback or primary blue
  if (fallbackColor) {
    return {
      main: fallbackColor,
      pastel: `${fallbackColor}1F`,
    };
  }

  return { main: "#3b82f6", pastel: "rgba(59, 130, 246, 0.12)" };
};

export default GlassCard;
