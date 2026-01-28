
import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface SubjectCardProps {
  title: string;
  icon: ReactNode;
  description: string;
  topicCount: number;
  color: string;
  purpose?: "reading" | "mcqs";
  onClick?: () => void;
  id?: string;
  levelId?: string;
  levelName?: string;
  systemId?: string;
  systemName?: string;
}

// Dynamic color theme mapping based on subject title
const getSubjectTheme = (title: string, fallbackColor: string): { main: string; pastel: string; pastelDark: string } => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('sindhi') || lowerTitle.includes('urdu')) {
    return { main: '#f59e0b', pastel: 'rgba(245, 158, 11, 0.08)', pastelDark: 'rgba(245, 158, 11, 0.15)' };
  }
  if (lowerTitle.includes('biology') || lowerTitle.includes('science')) {
    return { main: '#14b8a6', pastel: 'rgba(20, 184, 166, 0.08)', pastelDark: 'rgba(20, 184, 166, 0.15)' };
  }
  if (lowerTitle.includes('english')) {
    return { main: '#0ea5e9', pastel: 'rgba(14, 165, 233, 0.08)', pastelDark: 'rgba(14, 165, 233, 0.15)' };
  }
  if (lowerTitle.includes('math') || lowerTitle.includes('statistics')) {
    return { main: '#8b5cf6', pastel: 'rgba(139, 92, 246, 0.08)', pastelDark: 'rgba(139, 92, 246, 0.15)' };
  }
  if (lowerTitle.includes('physics')) {
    return { main: '#a855f7', pastel: 'rgba(168, 85, 247, 0.08)', pastelDark: 'rgba(168, 85, 247, 0.15)' };
  }
  if (lowerTitle.includes('chemistry')) {
    return { main: '#f43f5e', pastel: 'rgba(244, 63, 94, 0.08)', pastelDark: 'rgba(244, 63, 94, 0.15)' };
  }
  if (lowerTitle.includes('computer') || lowerTitle.includes('cs') || lowerTitle.includes('software')) {
    return { main: '#10b981', pastel: 'rgba(16, 185, 129, 0.08)', pastelDark: 'rgba(16, 185, 129, 0.15)' };
  }
  if (lowerTitle.includes('economics') || lowerTitle.includes('commerce')) {
    return { main: '#3b82f6', pastel: 'rgba(59, 130, 246, 0.08)', pastelDark: 'rgba(59, 130, 246, 0.15)' };
  }
  if (lowerTitle.includes('history') || lowerTitle.includes('civics')) {
    return { main: '#6366f1', pastel: 'rgba(99, 102, 241, 0.08)', pastelDark: 'rgba(99, 102, 241, 0.15)' };
  }
  if (lowerTitle.includes('geography')) {
    return { main: '#22c55e', pastel: 'rgba(34, 197, 94, 0.08)', pastelDark: 'rgba(34, 197, 94, 0.15)' };
  }
  
  // Default: use the color prop passed to the component
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  return { 
    main: fallbackColor || '#3b82f6', 
    pastel: hexToRgba(fallbackColor || '#3b82f6', 0.08),
    pastelDark: hexToRgba(fallbackColor || '#3b82f6', 0.15)
  };
};

const SubjectCard = ({ 
  title, 
  icon, 
  description, 
  topicCount,
  color,
  purpose = "mcqs",
  onClick,
  id,
  levelId,
  levelName,
  systemId,
  systemName
}: SubjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  const theme = getSubjectTheme(title, color);
  
  // Render icon with white color for the squircle container
  const renderIcon = () => {
    if (!icon) {
      return <BookOpen className="w-4 h-4 text-white" />;
    }
    
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, { 
        className: "w-4 h-4 text-white",
        style: { color: 'white' }
      });
    }
    
    return <BookOpen className="w-4 h-4 text-white" />;
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    const urlSlug = id || encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));
    
    navigate(`/subject-content/${urlSlug}`, { 
      state: { 
        title,
        id: id || title,
        subjectId: id,
        mode: purpose === "reading" ? "read" : "practice",
        purpose,
        color: theme.main,
        icon: null,
        topicCount,
        levelId,
        levelName,
        systemId,
        systemName
      } 
    });
  };
  
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer w-full group"
    >
      <div 
        className={`
          rounded-2xl p-3 min-h-[120px] flex flex-col
          border border-white/50 dark:border-white/20
          shadow-sm hover:shadow-lg
          transition-all duration-300
          backdrop-blur-sm glass-card themed-card
        `}
        style={{ 
          background: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(var(--card-rgb), var(--cards-opacity, 0.95)) 100%)`,
        }}
      >
        {/* Dark mode overlay */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 dark:opacity-100 pointer-events-none -z-10"
          style={{
            background: `linear-gradient(135deg, ${theme.pastelDark} 0%, rgba(15, 23, 42, 0.95) 100%)`
          }}
        />
        
        {/* Icon Squircle - Compact */}
        <div 
          className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center mb-2 transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: theme.main }}
        >
          {renderIcon()}
        </div>
        
        {/* Content */}
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-1 leading-tight">
          {title}
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 line-clamp-1 flex-1">
          {description}
        </p>
        
        {/* Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
          <span 
            className="text-[9px] font-bold uppercase tracking-wide"
            style={{ color: theme.main }}
          >
            {topicCount} Chapters
          </span>
          <div 
            className={`
              w-6 h-6 rounded-full flex items-center justify-center
              transition-transform duration-300
              ${isHovered ? 'rotate-[-45deg]' : ''}
            `}
            style={{ backgroundColor: theme.main }}
          >
            <ArrowRight className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubjectCard;
