
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const FeatureCard = ({ title, description, icon, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="bg-card border hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-2.5 flex flex-col">
          <div className="mb-2 text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</div>
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-muted-foreground text-xs line-clamp-2">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FeatureCard;
