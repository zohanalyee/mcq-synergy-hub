import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedGreeting } from "@/lib/greetings";
import { cn } from "@/lib/utils";

const DashboardHeader = () => {
  const { user, profile } = useAuth();
  const { language, isRTL } = useLanguage();
  const displayName = profile?.username || user?.email?.split('@')[0] || null;
  const greeting = getLocalizedGreeting(language, displayName);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <h1 className={cn("text-3xl font-bold text-foreground", isRTL && "font-nastaliq-heading text-right")}>
        {greeting}
      </h1>
      <p className={cn("text-muted-foreground", isRTL && "font-nastaliq text-right")}>
        View your progress and analytics
      </p>
    </motion.div>
  );
};

export default DashboardHeader;
