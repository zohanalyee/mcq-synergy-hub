import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
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

const starLabels: Record<string, string> = {
  five_star: '5',
  four_star: '4',
  three_star: '3',
  two_star: '2',
  one_star: '1',
};

const Reviews = () => {
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_review_stats');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as ReviewStats;
    },
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['all-reviews', filterRating, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*')
        .eq('display_publicly', true);

      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating));
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('rating', { ascending: false });
      }

      const { data } = await query;
      return data || [];
    },
  });

  const starKeys = ['five_star', 'four_star', 'three_star', 'two_star', 'one_star'] as const;

  return (
    <Header>
      <div className="container px-4 mx-auto py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">User Reviews</h1>
          <p className="text-sm text-muted-foreground">See what our community says about MCQs AI</p>
        </div>

        {/* Stats Overview */}
        {stats && stats.total_reviews > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.avg_rating}/5</div>
                <div className="flex justify-center gap-0.5 my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(stats.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{stats.total_reviews} reviews</p>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                {starKeys.map((key) => {
                  const count = (stats as any)[key] || 0;
                  const pct = stats.total_reviews ? (count / stats.total_reviews) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-right flex items-center gap-0.5">
                        {starLabels[key]}
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      </span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-16 text-xs text-muted-foreground">{count} reviews</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))
            : reviews?.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {review.reviewer_initials || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {review.show_name ? review.reviewer_name : 'Anonymous'}
                            </span>
                            {review.is_verified && (
                              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{review.reviewer_role}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/90 mt-2">&ldquo;{review.comment}&rdquo;</p>
                    )}
                  </CardContent>
                </Card>
              ))}

          {!isLoading && reviews?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No reviews found for this filter.</p>
          )}
        </div>
      </div>
    </Header>
  );
};

export default Reviews;
