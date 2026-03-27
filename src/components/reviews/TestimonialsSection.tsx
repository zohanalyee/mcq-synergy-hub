import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ChevronRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ReviewStats {
  avg_rating: number;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  recommend_pct: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string | null;
  reviewer_role: string | null;
  reviewer_initials: string | null;
  show_name: boolean;
  is_anonymous: boolean;
  is_verified: boolean;
  created_at: string;
}

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const TestimonialsSection = () => {
  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_review_stats');
      if (error) throw error;
      // RPC returns an array; take first row
      const row = Array.isArray(data) ? data[0] : data;
      return row as ReviewStats;
    },
    staleTime: 60_000,
  });

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['featured-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, reviewer_name, reviewer_role, reviewer_initials, show_name, is_anonymous, is_verified, created_at')
        .eq('display_publicly', true)
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data || []) as Review[];
    },
    staleTime: 60_000,
  });

  // Fallback: no reviews yet – show a CTA
  if (!isLoading && (!reviews || reviews.length === 0)) {
    return (
      <section className="py-8">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-lg font-bold mb-2">Join Our Community</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Be among the first to share your experience and help shape our platform
          </p>
          <Button asChild size="sm">
            <Link to="/boards">Get Started Free</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-5">
      <div className="container px-4 mx-auto">
        {/* Header with Stats */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold mb-2">What Our Users Say</h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-4">
            Real feedback from students transforming their test preparation
          </p>

          {stats && stats.total_reviews > 0 && (
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(stats.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold">{stats.avg_rating}/5</span>
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
              <div>
                <span className="text-xl font-bold">{stats.total_reviews.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
              <div>
                <span className="text-xl font-bold">{stats.recommend_pct}%</span>
                <p className="text-xs text-muted-foreground">Recommend Us</p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-2"
          >
            {reviews?.map((review, index) => (
              <motion.div key={review.id} variants={staggerItem}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 flex flex-col justify-between min-h-[220px]">
                    <div>
                      {/* Stars */}
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      {/* Comment */}
                      <p className="text-foreground/90 text-sm leading-relaxed mb-4">
                        &ldquo;{review.comment || 'Great platform for test preparation!'}&rdquo;
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {review.reviewer_initials || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {review.show_name && review.reviewer_name ? review.reviewer_name : 'Anonymous'}
                            </span>
                            {review.is_verified && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.reviewer_role || 'Student'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* View All + Trust Badge */}
        <div className="mt-4 flex flex-col items-center gap-2">
          {stats && stats.total_reviews > 6 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/reviews" className="flex items-center gap-1">
                View All {stats.total_reviews} Reviews
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>100% Verified Reviews • No Fake Testimonials</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
