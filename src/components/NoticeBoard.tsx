
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { submitFeedback } from "@/services/feedbackService";
import { useNavigate } from "react-router-dom";

const NoticeBoard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<string>("suggestion");
  const [rating, setRating] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim() || rating === 0) {
      toast({
        title: "Incomplete feedback",
        description: "Please provide feedback and a rating.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If not authenticated, we need to sign in first
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to submit feedback.",
        });
        setIsOpen(false);
        navigate("/sign-in");
        return;
      }

      const result = await submitFeedback({
        message: `${feedback} (Rating: ${rating}/5)`,
        type: feedbackType as any,
      });

      if (result) {
        toast({
          title: "Thank you for your feedback!",
          description: "We appreciate your input and will use it to improve MCQSAI.",
        });
        
        // Clear form
        setFeedback("");
        setRating(0);
        setFeedbackType("suggestion");
        setShowFeedbackForm(false);
        setIsOpen(false);
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    }
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
                <button
                  onClick={handleClose}
                  className="absolute right-2 top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <CardTitle className="text-primary text-2xl">
                  Welcome to MCQSAI
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
                          MCQs Point now has user accounts! <span className="font-semibold text-primary">Sign up</span> to:
                        </p>
                        
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>Save your progress and track performance</li>
                          <li>Customize your learning experience</li>
                          <li>Upload and manage your avatar</li>
                          <li>Submit feedback and suggestions</li>
                          <li>Access premium features</li>
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
                    {!user && (
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
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Feedback Type
                      </label>
                      <Select
                        value={feedbackType}
                        onValueChange={setFeedbackType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a feedback type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suggestion">Suggestion</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
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
                  {user ? (
                    <Button
                      variant="outline"
                      onClick={() => setShowFeedbackForm(true)}
                    >
                      Share Your Experience
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/sign-in");
                      }}
                    >
                      Sign In
                    </Button>
                  )}
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
