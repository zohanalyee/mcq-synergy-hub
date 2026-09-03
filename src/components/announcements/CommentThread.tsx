import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Flag, Trash2, MessageSquare, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  fetchComments,
  postComment,
  deleteOwnComment,
  reportComment,
} from '@/services/announcementService';
import { getEngagementKey, getGuestName, setGuestName } from '@/lib/announcementEngagement';
import { useAuthSafe } from '@/contexts/AuthContext';
import { trackEvent } from '@/utils/analytics';

interface CommentThreadProps {
  targetType: string;
  targetId: string;
  /** Contextual prompt to encourage meaningful discussion. */
  prompt?: string;
}

const MAX_LEN = 500;

const CommentThread = ({ targetType, targetId, prompt }: CommentThreadProps) => {
  const auth = useAuthSafe?.();
  const user = auth?.user ?? null;
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const [name, setName] = useState(getGuestName());
  const [submitting, setSubmitting] = useState(false);
  const myKey = getEngagementKey();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['announcement-comments', targetType, targetId],
    queryFn: () => fetchComments(targetType, targetId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['announcement-comments', targetType, targetId] });

  const handleSubmit = async () => {
    const text = body.trim();
    if (text.length < 2) {
      toast.error('Comment bohat chota hai');
      return;
    }
    const displayName = user
      ? (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Student'
      : name.trim() || 'Guest';

    setSubmitting(true);
    try {
      await postComment({ target_type: targetType, target_id: targetId, body: text, display_name: displayName });
      if (!user) setGuestName(displayName);
      setBody('');
      trackEvent('announcement_comment', { target_type: targetType, guest: !user });
      toast.success('Comment post ho gaya');
      refresh();
    } catch (error: any) {
      const msg = String(error?.message || '');
      toast.error(
        msg.includes('Rate limit')
          ? 'Thodi der baad dobara comment karein.'
          : msg.includes('Duplicate')
            ? 'Yeh comment pehle post ho chuka hai.'
            : msg.includes('spam') || msg.includes('links')
              ? 'Comment spam lag raha hai — links kam karein.'
              : 'Comment post nahi hua.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOwnComment(id);
      toast.success('Comment delete ho gaya');
      refresh();
    } catch {
      toast.error('Delete nahi ho saka');
    }
  };

  const handleReport = async (id: string) => {
    try {
      await reportComment(id);
      toast.success('Report bhej di gayi — shukriya');
      refresh();
    } catch {
      toast.error('Report already bhej di gayi hai');
    }
  };

  return (
    <section id="comments" className="mt-8 scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5 text-primary" />
        Discussion ({comments.length})
      </h2>

      {prompt && <p className="mt-1 text-sm text-muted-foreground">{prompt}</p>}

      <div className="mt-3 rounded-xl border border-border/60 bg-card/60 p-3 backdrop-blur-sm">
        {!user && (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aap ka naam (optional)"
            maxLength={40}
            className="mb-2"
          />
        )}
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
          placeholder={prompt || 'Apni raay likhein…'}
          rows={3}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {body.length}/{MAX_LEN}
            {!user && ' · Guest ke tor par post ho raha hai'}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="min-h-[44px]"
            size="sm"
          >
            {submitting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Comments load ho rahe hain…</p>}
        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sab se pehla comment aap karein.
          </p>
        )}
        {comments.map((c) => {
          const isMine = user ? c.user_id === user.id : c.guest_key === myKey && !c.user_id;
          return (
            <div key={c.id} className="rounded-lg border border-border/50 bg-card/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{c.display_name}</span>
                {c.user_id && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" /> Member
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{c.body}</p>
              <div className="mt-1 flex items-center gap-1">
                {isMine && user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c.id)}
                    className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReport(c.id)}
                  className="h-8 gap-1 px-2 text-xs text-muted-foreground"
                >
                  <Flag className="h-3.5 w-3.5" /> Report
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CommentThread;
