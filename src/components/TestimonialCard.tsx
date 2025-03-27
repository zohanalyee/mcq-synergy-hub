
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  content: string;
  author: string;
  role: string;
  rating: number;
  avatarSrc?: string;
  delay?: number;
}

const TestimonialCard = ({
  content,
  author,
  role,
  rating,
  avatarSrc,
  delay = 0,
}: TestimonialCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      viewport={{ once: true }}
      className="h-full"
    >
      <Card className="h-full">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex space-x-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="mb-6 text-foreground/90">{content}</p>
          </div>
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={avatarSrc} alt={author} />
              <AvatarFallback>{getInitials(author)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{author}</div>
              <div className="text-sm text-muted-foreground">{role}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TestimonialCard;
