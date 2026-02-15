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
      <Card className={`overflow-hidden border-none ${bgClass}`} onClick={onClick}>
        {/* Mobile: compact horizontal row */}
        <div className="flex md:hidden items-center gap-3 p-2.5 cursor-pointer">
          <div className="p-1.5 bg-white/20 rounded-lg shrink-0 [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
          <span className="flex-1 text-sm font-semibold truncate">{title}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
        </div>

        {/* Desktop: existing vertical layout */}
        <CardContent className="hidden md:flex p-4 flex-col h-full min-h-[140px]">
          <div className="mb-2 [&>svg]:h-6 [&>svg]:w-6">
            {icon}
          </div>
          <h3 className="text-base font-semibold mb-1 line-clamp-1">
            {title}
          </h3>
          <p className="text-xs text-white/80 mb-3 flex-grow line-clamp-2">
            {description}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="justify-between bg-background/20 backdrop-blur-sm border-none hover:bg-background/30 h-8 text-xs"
            onClick={onClick}
          >
            <span>Get Started</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestCategoryCard;
