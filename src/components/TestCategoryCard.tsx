import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface TestCategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgClass: string;
  onClick?: () => void;
}

const TestCategoryCard = ({
  title,
  description,
  icon,
  bgClass,
  onClick
}: TestCategoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className={`min-h-[100px] md:min-h-[140px] overflow-hidden border-none ${bgClass}`}>
        <CardContent className="p-3 md:p-4 flex flex-col h-full">
          {/* Icon - smaller on mobile */}
          <div className="mb-1.5 md:mb-2 [&>svg]:h-5 [&>svg]:w-5 md:[&>svg]:h-6 md:[&>svg]:w-6">
            {icon}
          </div>
          
          {/* Title - responsive sizing */}
          <h3 className="text-sm md:text-base font-semibold mb-0.5 md:mb-1 line-clamp-1">
            {title}
          </h3>
          
          {/* Description - hidden on very small, visible otherwise */}
          <p className="text-[10px] md:text-xs text-white/80 mb-2 md:mb-3 flex-grow line-clamp-2">
            {description}
          </p>
          
          {/* Button - compact */}
          <Button
            variant="outline"
            size="sm"
            className="justify-between bg-background/20 backdrop-blur-sm border-none hover:bg-background/30 h-7 md:h-8 text-[10px] md:text-xs"
            onClick={onClick}
          >
            <span>Get Started</span>
            <ChevronRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestCategoryCard;