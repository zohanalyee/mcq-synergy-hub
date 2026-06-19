import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Star, MessageSquare, TrendingUp, RefreshCw, Eye, Archive, CheckCircle, Globe, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  user_id: string;
  stars: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
  is_public: boolean;
}

const AdminFeedbackPanel = () => {
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [starsFilter, setStarsFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_feedback_stats');
      if (error) { console.error(error); return null; }
      return data?.[0] || null;
    },
  });

  // Fetch feedback list
  const { data: feedbackList, isLoading, refetch } = useQuery({
    queryKey: ['admin-feedback', categoryFilter, starsFilter],
    queryFn: async () => {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
      if (starsFilter !== 'all') query = query.eq('stars', parseInt(starsFilter));

      const { data, error } = await query;
      if (error) { console.error(error); toast.error('Failed to load feedback'); return []; }
      return data as FeedbackItem[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('user_feedback').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { error } = await supabase.from('user_feedback').update({ is_public }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-review-stats'] });
      toast.success(vars.is_public ? 'Published to reviews' : 'Hidden from reviews');
    },
    onError: () => toast.error('Failed to update visibility'),
  });

  const renderStars = (rating: number, size = 'w-3.5 h-3.5') => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(size, s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20')} />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      new: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
      reviewed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      addressed: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
      archived: 'bg-muted text-muted-foreground border-border',
    };
    return <Badge variant="outline" className={cn('text-[10px]', map[status])}>{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, string> = {
      Content: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      Design: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      Technical: 'bg-red-500/10 text-red-600 dark:text-red-400',
      Other: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="outline" className={cn('text-[10px] border-0', map[category])}>{category}</Badge>;
  };

  const starLabels = ['one_star', 'two_stars', 'three_stars', 'four_stars', 'five_stars'] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.avg_rating?.toFixed(1) || '0.0'}</div>
                <div className="text-[10px] text-muted-foreground">Avg Rating</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total_feedback || 0}</div>
                <div className="text-[10px] text-muted-foreground">Total Feedback</div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Rating Distribution</span>
              </div>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = Number(stats[starLabels[s - 1]] || 0);
                  const pct = stats.total_feedback ? (count / Number(stats.total_feedback)) * 100 : 0;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-muted-foreground">{s}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Content">Content</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Technical">Technical</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={starsFilter} onValueChange={setStarsFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stars</SelectItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <SelectItem key={s} value={String(s)}>{s} Star{s > 1 ? 's' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="h-8 text-xs ml-auto">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
        <span className="text-xs text-muted-foreground">{feedbackList?.length || 0} results</span>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <CardContent className="py-12 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        ) : feedbackList && feedbackList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Message</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbackList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{renderStars(item.stars)}</TableCell>
                  <TableCell>{getCategoryBadge(item.category)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-foreground">{item.message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => {
                        setSelectedItem(item);
                        if (item.status === 'new') updateStatusMutation.mutate({ id: item.id, status: 'reviewed' });
                      }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No feedback yet</p>
          </CardContent>
        )}
      </Card>

      {/* Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">Feedback Detail</DialogTitle>
              <DialogDescription className="text-xs">
                {formatDistanceToNow(new Date(selectedItem.created_at), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {renderStars(selectedItem.stars, 'w-5 h-5')}
                <div className="flex gap-1.5">
                  {getStatusBadge(selectedItem.status)}
                  {getCategoryBadge(selectedItem.category)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedItem.message}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => { updateStatusMutation.mutate({ id: selectedItem.id, status: 'addressed' }); setSelectedItem(null); }}>
                  <CheckCircle className="w-3 h-3 mr-1" /> Addressed
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => { updateStatusMutation.mutate({ id: selectedItem.id, status: 'archived' }); setSelectedItem(null); }}>
                  <Archive className="w-3 h-3 mr-1" /> Archive
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default AdminFeedbackPanel;
