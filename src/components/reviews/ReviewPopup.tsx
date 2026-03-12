import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

interface ReviewPopupProps {
  testId?: string;
  open: boolean;
  onClose: () => void;
}

const ROLES = [
  'Medical Student',
  'Engineering Student',
  'CSS Aspirant',
  'MDCAT Candidate',
  'ECAT Candidate',
  'NUST Candidate',
  'University Student',
  'High School Student',
  'Teacher',
  'Other',
];

export const ReviewPopup = ({ testId, open, onClose }: ReviewPopupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [displayPublicly, setDisplayPublicly] = useState(true);
  const [showName, setShowName] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Check for existing review when dialog opens
  useEffect(() => {
    if (!open || !user?.id) return;
    const check = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setAlreadyReviewed(true);
    };
    check();
  }, [open, user?.id]);

  const handleSubmit = async () => {
    if (alreadyReviewed) {
      toast({ title: "You've already shared your feedback!", description: 'Thank you for your previous review.' });
      return;
    }

    if (rating === 0) {
      toast({ title: 'Rating Required', description: 'Please select a star rating', variant: 'destructive' });
      return;
    }

    if (!user && !guestName && displayPublicly && showName) {
      toast({ title: 'Name Required', description: 'Please enter your name or choose to post anonymously', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const reviewData = {
        user_id: user?.id || null,
        rating,
        comment: comment.trim() || null,
        display_publicly: displayPublicly,
        show_name: displayPublicly ? showName : false,
        is_anonymous: displayPublicly ? !showName : true,
        reviewer_name: user?.user_metadata?.full_name || guestName || 'Anonymous User',
        reviewer_role: role || 'Student',
      };

      const { error } = await supabase.from('reviews').insert(reviewData);
      if (error) throw error;

      toast({ title: 'Thank you! 🎉', description: 'Your feedback helps us improve' });
      setRating(0);
      setComment('');
      setGuestName('');
      setRole('');
      onClose();

      // Instantly refresh related queries
      queryClient.invalidateQueries({ queryKey: ['review-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
    } catch (error) {
      console.error('Review submission error:', error);
      toast({ title: 'Error', description: 'Failed to submit review. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const ratingLabel = (r: number) => {
    const labels: Record<number, string> = { 5: '⭐ Excellent!', 4: '👍 Great!', 3: '👌 Good!', 2: '😐 Okay', 1: '😞 Poor' };
    return labels[r] || '';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">How was your experience?</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Star Rating */}
          <div className="text-center space-y-2">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium text-muted-foreground"
                >
                  {ratingLabel(rating)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="review-comment">Share your thoughts (optional)</Label>
            <Textarea
              id="review-comment"
              placeholder="What did you like? What can we improve?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="resize-none mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/500</p>
          </div>

          {/* Guest Name */}
          {!user && displayPublicly && showName && (
            <div>
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <Label>Your Role (optional)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Privacy Options */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <Label htmlFor="displayPublicly" className="text-sm cursor-pointer">
                Share publicly on website
              </Label>
              <input
                type="checkbox"
                id="displayPublicly"
                checked={displayPublicly}
                onChange={(e) => setDisplayPublicly(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-primary"
              />
            </div>

            {displayPublicly && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center justify-between pl-4 border-l-2 border-primary/20"
              >
                <Label htmlFor="showName" className="text-sm cursor-pointer">
                  Show my name
                </Label>
                <input
                  type="checkbox"
                  id="showName"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground">
              {displayPublicly
                ? showName
                  ? '✓ Your review will be public with your name'
                  : '✓ Your review will be public anonymously'
                : '✓ Your review will be private (for improvement only)'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Skip for Now
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={loading || rating === 0}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewPopup;
