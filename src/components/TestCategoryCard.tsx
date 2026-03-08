import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";

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
      whileHover={{ scale: 1.03, y: -3 }}
      className="h-full group"
    >
      <Card className={`overflow-hidden border-none ${bgClass} relative`} onClick={onClick}>
        {/* Continuous subtle shimmer sweep */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
        </div>
        {/* Hover shimmer - faster */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        {/* Animated corner sparkle */}
        <motion.div
          className="absolute top-2 right-2 pointer-events-none hidden md:block"
          animate={{ rotate: [0, 20, -15, 0], scale: [0.8, 1.1, 0.9, 0.8], opacity: [0.2, 0.5, 0.3, 0.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="h-3 w-3 text-white/30" />
        </motion.div>
        {/* Mobile: compact horizontal row */}
        <div className="flex md:hidden items-center gap-3 p-2.5 cursor-pointer relative z-10">
          <motion.div 
            className="p-1.5 bg-white/20 rounded-lg shrink-0 [&>svg]:h-5 [&>svg]:w-5"
            animate={{ boxShadow: ['0 0 0px rgba(255,255,255,0)', '0 0 8px rgba(255,255,255,0.15)', '0 0 0px rgba(255,255,255,0)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {icon}
          </motion.div>
          <span className="flex-1 text-sm font-semibold truncate">{title}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
        </div>

        {/* Desktop: existing vertical layout */}
        <CardContent className="hidden md:flex p-4 flex-col h-full min-h-[140px] relative z-10">
          <motion.div 
            className="mb-2 [&>svg]:h-6 [&>svg]:w-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {icon}
          </motion.div>
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
