
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface TopicCardProps {
  title: string;
  content: string;
  index: number;
}

const TopicCard = ({ title, content, index }: TopicCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-3">{title}</h3>
          <p className="text-muted-foreground">{content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopicCard;
