import { useState, useEffect } from 'react';
import SEOHead from '@/components/SEOHead';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface FeedbackReview {
  id: string;
  user_name: string | null;
  user_avatar_url: string | null;
  stars: number;
  message: string | null;
  category: string;
  created_at: string;
  is_guest: boolean | null;
}

const Reviews = () => {
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const channel = supabase
      .channel('feedback-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedback' }, () => {
        queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
        queryClient.invalidateQueries({ queryKey: ['public-review-stats'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: stats } = useQuery({
    queryKey: ['public-review-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('stars');
      if (error) throw error;
      const all = data || [];
      const total = all.length;
      if (total === 0) return null;
      const avg = all.reduce((s, r) => s + r.stars, 0) / total;
      return {
        avg_rating: Math.round(avg * 10) / 10,
        total_reviews: total,
        five_star: all.filter(r => r.stars === 5).length,
        four_star: all.filter(r => r.stars === 4).length,
        three_star: all.filter(r => r.stars === 3).length,
        two_star: all.filter(r => r.stars === 2).length,
        one_star: all.filter(r => r.stars === 1).length,
      };
    },
  });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['public-reviews', filterRating, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('user_feedback')
        .select('id, user_name, user_avatar_url, stars, message, category, created_at, is_guest');

      if (filterRating !== 'all') {
        query = query.eq('stars', parseInt(filterRating));
      }

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('stars', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      return (data || []) as FeedbackReview[];
    },
  });

  const starKeys = ['five_star', 'four_star', 'three_star', 'two_star', 'one_star'] as const;
  const starLabels: Record<string, string> = {
    five_star: '5', four_star: '4', three_star: '3', two_star: '2', one_star: '1',
  };

  const getInitials = (name: string | null, isGuest: boolean | null) => {
    if (!name) return isGuest ? '👤' : 'U';
    const words = name.trim().split(' ');
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : words[0][0].toUpperCase();
  };

  return (
    <Header>
      <div className="container px-4 mx-auto py-8 max-w-4xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">User Reviews</h1>
          <p className="text-sm text-muted-foreground">See what our community says about MCQs AI</p>
        </div>

        {stats && stats.total_reviews > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
              <div className="text-center">
                <div className="text-4xl font-bold">{stats.avg_rating}/5</div>
                <div className="flex justify-center gap-0.5 my-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(stats.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{stats.total_reviews} reviews</p>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {starKeys.map((key) => {
                  const count = stats[key] || 0;
                  const pct = (count / stats.total_reviews) * 100;
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

        <div className="flex gap-3 mb-4">
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
            : reviews?.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.user_avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(review.user_name, review.is_guest)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {review.user_name || 'Anonymous User'}
                            </span>
                            {review.is_guest && (
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Guest</span>
                            )}
                          </div>
                          {review.category && (
                            <span className="text-xs text-muted-foreground">{review.category}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i < review.stars ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    {review.message && (
                      <p className="text-sm text-foreground/90 mt-2">&ldquo;{review.message}&rdquo;</p>
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
