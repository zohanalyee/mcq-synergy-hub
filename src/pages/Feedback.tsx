import { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const categories = [
  { value: 'Content', label: 'Content Quality', icon: '📚', description: 'MCQs, explanations, topics' },
  { value: 'Design', label: 'Design & UI', icon: '🎨', description: 'Look, feel, user interface' },
  { value: 'Technical', label: 'Technical Issues', icon: '⚙️', description: 'Bugs, errors, performance' },
  { value: 'Other', label: 'Other', icon: '💬', description: 'General feedback' },
];

const Feedback = () => {
  const { user } = useAuth();
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to submit feedback');
      return;
    }

    if (stars === 0) {
      toast.error('Please select a star rating');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (message.trim().length < 10) {
      toast.error('Please write at least 10 characters');
      return;
    }

    if (message.trim().length > 500) {
      toast.error('Message must be under 500 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          stars,
          category,
          message: message.trim(),
        });

      if (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Failed to submit feedback. Please try again.');
        return;
      }

      setIsSuccess(true);
      toast.success('Thank you for helping us improve! 🎉');

      setTimeout(() => {
        setStars(0);
        setCategory('');
        setMessage('');
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Header>
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full mb-3">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">We Value Your Feedback</h1>
          <p className="text-muted-foreground">
            Help us make MCQSAI better for everyone!
          </p>
        </div>

        {!user ? (
          <Card>
            <CardContent className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Please sign in to submit feedback</p>
              <Button asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        ) : isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-green-500/30">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Thank You! 🎉</h2>
                <p className="text-muted-foreground">Your feedback helps us improve MCQSAI</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card>
            <CardContent className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    How would you rate your experience? <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setStars(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110 focus:outline-none p-1"
                      >
                        <Star
                          className={cn(
                            'w-10 h-10 md:w-12 md:h-12 transition-colors',
                            star <= (hoveredStar || stars)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  {stars > 0 && (
                    <p className="text-center mt-2 text-xs text-muted-foreground">
                      {stars === 5 && '⭐ Excellent!'}
                      {stars === 4 && '😊 Very Good!'}
                      {stars === 3 && '👍 Good'}
                      {stars === 2 && '😐 Could be better'}
                      {stars === 1 && '😞 Needs improvement'}
                    </p>
                  )}
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    What type of feedback is this? <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all text-left',
                          category === cat.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xl">{cat.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{cat.label}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{cat.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Tell us more <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                    placeholder="Share your thoughts, suggestions, or report issues..."
                    className="resize-none"
                    disabled={isSubmitting}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Min 10 characters • {message.length}/500
                  </p>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || stars === 0 || !category || message.trim().length < 10}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        {!isSuccess && user && (
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { emoji: '⚡', title: 'Quick Response', desc: 'We review feedback daily' },
              { emoji: '🔒', title: 'Private', desc: 'Your privacy matters' },
              { emoji: '🎯', title: 'Every Voice Counts', desc: 'We value your input' },
            ].map((item) => (
              <Card key={item.title} className="p-3 text-center">
                <div className="text-lg mb-1">{item.emoji}</div>
                <div className="text-[10px] font-medium text-foreground">{item.title}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{item.desc}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Header>
  );
};

export default Feedback;
