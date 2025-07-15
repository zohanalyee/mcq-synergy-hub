
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
  purpose = "mcqs", // Default to MCQs if not specified
  onClick 
}: SubjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  // Safely render the icon
  const renderDisplayIcon = () => {
    // If no icon provided, use default
    if (!icon) {
      return <FileText className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;
    }
    
    // If it's a valid React element
    if (React.isValidElement(icon)) {
      // Need to use type assertion to handle TypeScript constraints on cloneElement
      return React.cloneElement(icon as React.ReactElement<any>, { 
        className: "h-6 w-6",
        style: { color: color || '#3b82f6' } 
      });
    }
    
    // Fallback
    return <FileText className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    // Navigate to the appropriate page based on purpose
    if (purpose === "reading") {
      navigate(`/subject-content/${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"))}`, { 
        state: { 
          title,
          purpose,
          color,
          icon: null, // Don't pass React elements directly in navigation state
          topicCount
        } 
      });
    } else {
      // For MCQs, we'll navigate to the custom syllabus page with the subject preselected
      navigate(`/custom-syllabus`, { 
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
      className="cursor-pointer"
    >
      <Card className="overflow-hidden transition-all duration-300 border-t-4 shadow-md hover:shadow-lg h-[180px] flex flex-col"
        style={{ borderTopColor: color }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                {renderDisplayIcon()}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs font-medium text-muted-foreground">
                  {topicCount} Topics
                </span>
                <Badge 
                  variant={purpose === "reading" ? "outline" : "default"}
                  className={cn(
                    "flex items-center gap-1 text-xs h-5",
                    purpose === "reading" ? "border-blue-500 text-blue-600" : "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {purpose === "reading" ? (
                    <>
                      <FileText className="h-2.5 w-2.5" /> Reading
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-2.5 w-2.5" /> MCQs
                    </>
                  )}
                </Badge>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
            <p className="text-muted-foreground text-xs mb-3 line-clamp-2 flex-1">{description}</p>
            
            <div className={cn(
              "text-xs font-medium transition-all duration-300 flex items-center justify-between mt-auto",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              <span>Explore Topics →</span>
              {purpose === "reading" ? (
                <span className="text-xs text-blue-500">Learn by Reading</span>
              ) : (
                <span className="text-xs text-green-500">Practice with MCQs</span>
              )}
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SubjectCard;
