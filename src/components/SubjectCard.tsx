
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
}

const SubjectCard = ({ 
  title, 
  icon, 
  description, 
  topicCount,
  color,
  purpose = "mcqs",
  onClick 
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
    
    if (purpose === "reading") {
      navigate(`/subject-content/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"))}`, { 
        state: { 
          title,
          purpose,
          color,
          icon: null,
          topicCount
        } 
      });
    } else {
      navigate(`/custom-quizzes`, { 
        state: { 
          preselectedSubject: title,
          purpose
        } 
      });
    }
  };
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer w-full max-w-md mx-auto"
    >
      <Card className="overflow-hidden transition-all duration-300 border-t-4 shadow-md hover:shadow-lg min-h-[180px] max-h-[240px] flex flex-col"
        style={{ borderTopColor: color }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 sm:p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                {renderDisplayIcon()}
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <span className="text-xs font-medium text-muted-foreground">
                  {topicCount} Topics
                </span>
                <Badge 
                  variant={purpose === "reading" ? "outline" : "default"}
                  className={cn(
                    "flex items-center gap-1 text-xs h-5 px-1.5",
                    purpose === "reading" ? "border-blue-500 text-blue-600" : "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {purpose === "reading" ? (
                    <>
                      <FileText className="h-3 w-3" /> Reading
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-3 w-3" /> MCQs
                    </>
                  )}
                </Badge>
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2 leading-tight">{title}</h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2 flex-1 leading-relaxed">{description}</p>
            
            <div className={cn(
              "text-xs font-medium transition-all duration-300 flex items-center justify-between mt-auto pt-1.5 border-t border-border/30",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              <span className="flex items-center gap-1.5">
                Explore Topics 
                <span className="transition-transform duration-300" style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)' }}>
                  →
                </span>
              </span>
              {purpose === "reading" ? (
                <span className="text-xs text-blue-500 font-medium">Learn by Reading</span>
              ) : (
                <span className="text-xs text-green-500 font-medium">Practice with MCQs</span>
              )}
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SubjectCard;
