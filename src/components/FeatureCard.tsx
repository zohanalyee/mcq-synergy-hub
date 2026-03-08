import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
  delay?: number;
}

const FeatureCard = ({ title, description, icon, iconColor = "from-primary to-accent", delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="bg-card border hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardContent className="p-2.5 flex flex-col">
          <motion.div
            className={`mb-2 w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${iconColor} flex items-center justify-center text-white [&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-5 md:[&>svg]:w-5 shadow-sm`}
            animate={{ 
              scale: [1, 1.08, 1],
              rotate: [0, 3, -3, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 1 + (delay ?? 0) * 0.5,
              ease: "easeInOut",
            }}
          >
            {icon}
          </motion.div>
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-muted-foreground text-xs line-clamp-2">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeatureCard;
