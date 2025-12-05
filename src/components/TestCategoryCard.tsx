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
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} whileHover={{
    scale: 1.02
  }} className="h-full">
      <Card className={`min-h-[160px] max-h-[200px] overflow-hidden border-none ${bgClass}`}>
        <CardContent className="p-4 flex flex-col">
          <div className="mb-2 [&>svg]:h-6 [&>svg]:w-6">{icon}</div>
          <h3 className="text-base font-semibold mb-1">{title}</h3>
          <p className="text-xs text-white/80 mb-3 flex-grow line-clamp-2">{description}</p>
          <Button variant="outline" size="sm" className="justify-between bg-background/20 backdrop-blur-sm border-none hover:bg-background/30 h-8" onClick={onClick}>
            <span className="text-xs">Get Started</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>;
};
export default TestCategoryCard;