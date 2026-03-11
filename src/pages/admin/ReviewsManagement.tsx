import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const ReviewsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('reviews')
        .update({ is_verified: true, verified_at: new Date().toISOString(), verified_by: user?.id })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review verified ✓' });
    },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ display_publicly: !current })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Visibility updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast({ title: 'Review deleted' });
    },
  });

  return (
    <Header>
      <div className="container px-4 mx-auto py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Reviews Management</h1>

        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/50" /></Card>
              ))
            : reviews?.map((review: any) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm">{review.reviewer_name || 'Anonymous'}</span>
                          <Badge variant={review.is_verified ? 'default' : 'secondary'} className="text-[10px]">
                            {review.is_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                          <Badge variant={review.display_publicly ? 'default' : 'outline'} className="text-[10px]">
                            {review.display_publicly ? 'Public' : 'Private'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-foreground/80 truncate">{review.comment}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!review.is_verified && (
                          <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate(review.id)}>
                            <Check className="h-3.5 w-3.5 mr-1" />Verify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVisibility.mutate({ id: review.id, current: review.display_publicly })}
                        >
                          {review.display_publicly ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('Delete this review?')) deleteMutation.mutate(review.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </Header>
  );
};

export default ReviewsManagement;
