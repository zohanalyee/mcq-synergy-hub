
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
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
  id?: string;        // database UUID for LMS subjects
  levelId?: string;   // LMS level UUID
  systemId?: string;  // LMS system UUID
}

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
  systemId
}: SubjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  const renderDisplayIcon = () => {
    if (!icon) {
      return <FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: color || '#3b82f6' }} />;
    }
    
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement<any>, { 
        className: "h-5 w-5 sm:h-6 sm:w-6",
        style: { color: color || '#3b82f6' } 
      });
    }
    
    return <FileText className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: color || '#3b82f6' }} />;
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Use database ID if available (LMS subjects), otherwise fallback to title-based slug
    const urlSlug = id || encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"));
    
    // Navigate to subject-content for BOTH reading and MCQs
    navigate(`/subject-content/${urlSlug}`, { 
      state: { 
        title,
        id: id || title,
        mode: purpose === "reading" ? "read" : "practice",
        purpose,
        color,
        icon: null,
        topicCount,
        levelId,
        systemId
      } 
    });
  };
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer w-full"
    >
      <Card className="overflow-hidden transition-all duration-300 border-t-2 shadow-sm hover:shadow-md min-h-[140px] max-h-[180px] flex flex-col"
        style={{ borderTopColor: color }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <CardContent className="p-3 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md" style={{ backgroundColor: `${color}20` }}>
                {renderDisplayIcon()}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {topicCount} Topics
              </span>
            </div>
            
            <h3 className="text-sm font-semibold mb-1 line-clamp-1 leading-tight">{title}</h3>
            <p className="text-muted-foreground text-xs mb-2 line-clamp-2 flex-1 leading-snug">{description}</p>
            
            <div className={cn(
              "text-[10px] font-medium transition-all duration-300 flex items-center justify-between mt-auto pt-1 border-t border-border/30",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              <span className="flex items-center gap-1">
                Explore 
                <span className="transition-transform duration-300" style={{ transform: isHovered ? 'translateX(2px)' : 'translateX(0)' }}>
                  →
                </span>
              </span>
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SubjectCard;
