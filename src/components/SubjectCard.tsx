
import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface SubjectCardProps {
  title: string;
  icon: React.ReactNode;
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
          icon,
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
      <Card className="overflow-hidden transition-all duration-300 border-t-4 shadow-md hover:shadow-lg"
        style={{ borderTopColor: color }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                {icon}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className="text-sm font-medium text-muted-foreground">
                  {topicCount} Topics
                </span>
                <Badge 
                  variant={purpose === "reading" ? "outline" : "default"}
                  className={cn(
                    "flex items-center gap-1",
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
            
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{description}</p>
            
            <div className={cn(
              "text-sm font-medium transition-all duration-300 flex items-center justify-between",
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
