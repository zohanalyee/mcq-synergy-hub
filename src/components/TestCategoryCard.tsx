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
      <Card className={`min-h-[220px] max-h-[280px] overflow-hidden border-none ${bgClass}`}>
        <CardContent className="p-6 flex flex-col">
          <div className="mb-4 px-0 py-[10px] my-[10px]">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-6 flex-grow">{description}</p>
          <Button variant="outline" className="justify-between bg-background/20 backdrop-blur-sm border-none hover:bg-background/30" onClick={onClick}>
            <span>Get Started</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>;
};
export default TestCategoryCard;