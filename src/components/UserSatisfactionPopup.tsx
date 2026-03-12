import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "ai-mcqs-has-rated";
const POPUP_DELAY_MS = 2 * 60 * 1000; // 2 minutes

const UserSatisfactionPopup = () => {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Check if user already has a rating
    const checkExisting = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("user_ratings" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setAlreadyRated(true);
        localStorage.setItem(STORAGE_KEY, "true");
        return;
      }
    };

    checkExisting();

    const timer = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user?.id]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      // Double-check for existing rating
      if (user?.id) {
        const { data: existing } = await supabase
          .from("user_ratings" as any)
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          toast({
            title: "You've already shared your feedback!",
            description: "Thank you for your previous rating.",
          });
          localStorage.setItem(STORAGE_KEY, "true");
          setVisible(false);
          return;
        }
      }

      const { error } = await supabase.from("user_ratings" as any).insert({
        rating,
        user_id: user?.id ?? null,
      } as any);

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "Your rating helps us improve.",
      });
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);

      // Instantly refresh related queries
      queryClient.invalidateQueries({ queryKey: ["review-stats"] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (err) {
      console.error("Rating submission error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyRated) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 w-[320px] rounded-2xl border bg-card text-card-foreground shadow-xl p-5"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>

          <p className="text-sm font-semibold mb-1">How's your experience?</p>
          <p className="text-xs text-muted-foreground mb-4">
            Rate AI-MCQs Point to help us improve
          </p>

          <div className="flex gap-1 justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`transition-colors ${
                    star <= (hoveredStar || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg text-white"
            size="sm"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserSatisfactionPopup;
