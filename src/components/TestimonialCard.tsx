
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
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card className="min-h-[240px] max-h-[320px] hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6 flex flex-col justify-between">
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
