
import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SubjectCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  topicCount: number;
  color: string;
  onClick?: () => void;
}

const SubjectCard = ({ 
  title, 
  icon, 
  description, 
  topicCount,
  color,
  onClick 
}: SubjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-pointer"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-t-4",
        `border-t-[${color}]`,
        isHovered ? "shadow-lg" : "shadow-md"
      )}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={cn(
                "p-3 rounded-lg",
                `bg-[${color}]/10`
              )}>
                {icon}
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {topicCount} Topics
              </span>
            </div>
            
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{description}</p>
            
            <div className={cn(
              "text-sm font-medium transition-all duration-300",
              isHovered ? "text-primary" : "text-foreground"
            )}>
              Explore Topics →
            </div>
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export default SubjectCard;
