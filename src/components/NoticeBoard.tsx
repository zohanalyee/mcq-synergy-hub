
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const NoticeBoard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if we've shown the notice before in this session
    const hasShownNotice = sessionStorage.getItem("hasShownNotice");
    if (hasShownNotice) {
      setIsOpen(false);
    } else {
      sessionStorage.setItem("hasShownNotice", "true");
    }
  }, []);
  
  const handleClose = () => {
    setIsOpen(false);
  };
  
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !feedback.trim() || rating === 0) {
      toast({
        title: "Incomplete feedback",
        description: "Please fill all fields and provide a rating.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, we'd send this to the backend
    console.log("Feedback submitted:", { name, feedback, rating });
    
    toast({
      title: "Thank you for your feedback!",
      description: "We appreciate your input and will use it to improve MCQs Point.",
    });
    
    // Clear form
    setName("");
    setFeedback("");
    setRating(0);
    setShowFeedbackForm(false);
    setIsOpen(false);
  };
  
  const StarRating = () => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${
              star <= rating ? "text-yellow-500" : "text-gray-300"
            }`}
            onClick={() => setRating(star)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="w-full max-w-md"
          >
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="relative pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="absolute right-2 top-2"
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-primary text-2xl">
                  Welcome to MCQs Point
                </CardTitle>
                <CardDescription>
                  Your intelligent companion for MCQ preparation
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {!showFeedbackForm ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="space-y-4">
                      <div className="rounded-md bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                        <p className="text-amber-800 dark:text-amber-200 font-medium">
                          🚧 Website Under Development 🚧
                        </p>
                        <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                          We're working hard to bring you the best MCQ preparation experience. Some features may be limited or unavailable.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          MCQs Point is now available for <span className="font-semibold text-primary">free</span> access to all users! No login required to:
                        </p>
                        
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>Practice with thousands of MCQs across subjects</li>
                          <li>Take timed mock tests</li>
                          <li>Access subject materials and references</li>
                          <li>Track your progress and view analytics</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleFeedbackSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Your Name
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Your Experience
                      </label>
                      <Textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Share your thoughts about MCQs Point..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Rate Your Experience
                      </label>
                      <StarRating />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFeedbackForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1">
                        Submit Feedback
                      </Button>
                    </div>
                  </motion.form>
                )}
              </CardContent>
              
              {!showFeedbackForm && (
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                  >
                    Continue to Site
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFeedbackForm(true)}
                  >
                    Share Your Experience
                  </Button>
                </CardFooter>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NoticeBoard;
