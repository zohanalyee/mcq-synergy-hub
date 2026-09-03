import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Megaphone, Plus, Pencil, Trash2, ShieldAlert, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Announcement,
  deleteAnnouncement,
  listAllAnnouncements,
  saveAnnouncement,
} from '@/services/announcementService';
import { detectTopics, evaluateAnnouncementQuality } from '@/lib/announcementEngagement';
import { slugify } from '@/utils/slugify';

const emptyForm = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  type: 'notice',
  is_urgent: false,
  is_pinned: false,
  status: 'published',
  image_url: '',
  document_url: '',
  meta_title: '',
  meta_description: '',
};

type FormState = typeof emptyForm & { id?: string };

const AnnouncementsManager = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: listAllAnnouncements,
  });

  const detected = useMemo(() => detectTopics(form.title, form.body), [form.title, form.body]);
  const quality = useMemo(
    () =>
      evaluateAnnouncementQuality({
        title: form.title,
        body: form.body,
        summary: form.summary,
        topicSlugs: detected.map((t) => t.topic_slug),
      }),
    [form, detected],
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const openNew = () => {
    setForm({ ...emptyForm });
    setOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setForm({
      id: a.id,
      title: a.title,
      slug: a.slug,
      summary: a.summary ?? '',
      body: a.body,
      type: a.type,
      is_urgent: a.is_urgent,
      is_pinned: a.is_pinned,
      status: a.status,
      image_url: a.image_url ?? '',
      document_url: a.document_url ?? '',
      meta_title: a.meta_title ?? '',
      meta_description: a.meta_description ?? '',
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title aur body zaroori hain');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await saveAnnouncement(
        {
          ...(form.id ? { id: form.id } : {}),
          title: form.title.trim(),
          slug: (form.slug || slugify(form.title)).trim(),
          summary: form.summary.trim() || null,
          body: form.body,
          type: form.type,
          is_urgent: form.is_urgent,
          is_pinned: form.is_pinned,
          status: form.status,
          is_indexable: quality.indexable,
          image_url: form.image_url.trim() || null,
          document_url: form.document_url.trim() || null,
          meta_title: form.meta_title.trim() || null,
          meta_description: form.meta_description.trim() || null,
          published_at: form.status === 'published' ? now : null,
          content_updated_at: now,
        } as Partial<Announcement>,
        detected,
      );
      toast.success(form.id ? 'Announcement update ho gaya' : 'Announcement publish ho gaya');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement-feed'] });
    } catch (error: any) {
      toast.error(error?.message?.includes('duplicate') ? 'Yeh slug pehle mojood hai' : 'Save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement delete ho gaya');
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    } catch {
      toast.error('Delete nahi ho saka');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" /> Announcements ({items.length})
          </CardTitle>
          <Button size="sm" onClick={openNew} className="min-h-[40px] gap-1">
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Koi announcement nahi. Pehla notice post karein (test date change, result etc.).
            </p>
          )}
          {items.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 p-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  /announcements/{a.slug} ·{' '}
                  {format(new Date(a.published_at || a.created_at), 'd MMM yyyy')} · {a.view_count} views
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant={a.status === 'published' ? 'default' : 'outline'} className="text-[10px]">
                  {a.status}
                </Badge>
                {a.is_urgent && (
                  <Badge variant="outline" className="border-rose-500/40 text-[10px] text-rose-500">
                    urgent
                  </Badge>
                )}
                {a.is_pinned && <Badge variant="secondary" className="text-[10px]">pinned</Badge>}
                {!a.is_indexable && (
                  <Badge variant="outline" className="gap-1 text-[10px] text-amber-500">
                    <ShieldAlert className="h-3 w-3" /> noindex
                  </Badge>
                )}
                <Button variant="ghost" size="sm" asChild className="h-9 px-2">
                  <a href={`/announcements/${a.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => openEdit(a)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-destructive"
                  onClick={() => handleDelete(a.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit announcement' : 'New announcement'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="ann-title">Title</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="MDCAT 2026 test date postponed — new schedule"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ann-slug">Slug (optional)</Label>
                <Input
                  id="ann-slug"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder={form.title ? slugify(form.title) : 'auto from title'}
                />
              </div>
              <div>
                <Label htmlFor="ann-type">Type</Label>
                <select
                  id="ann-type"
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="notice">Notice</option>
                  <option value="exam_date">Exam date</option>
                  <option value="result">Result</option>
                  <option value="postponement">Postponement</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="ann-summary">Summary</Label>
              <Textarea
                id="ann-summary"
                rows={2}
                value={form.summary}
                onChange={(e) => set('summary', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="ann-body">Body (HTML allowed)</Label>
              <Textarea
                id="ann-body"
                rows={10}
                value={form.body}
                onChange={(e) => set('body', e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ann-image">Image URL</Label>
                <Input id="ann-image" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ann-doc">Official PDF URL</Label>
                <Input
                  id="ann-doc"
                  value={form.document_url}
                  onChange={(e) => set('document_url', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ann-mt">Meta title</Label>
                <Input id="ann-mt" value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ann-md">Meta description</Label>
                <Input
                  id="ann-md"
                  value={form.meta_description}
                  onChange={(e) => set('meta_description', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_urgent} onCheckedChange={(v) => set('is_urgent', v)} /> Urgent
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_pinned} onCheckedChange={(v) => set('is_pinned', v)} /> Pinned
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.status === 'published'}
                  onCheckedChange={(v) => set('status', v ? 'published' : 'draft')}
                />
                Published
              </label>
            </div>

            {/* Auto topic detection + SEO quality gate feedback */}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
              <p className="font-medium">Detected topics</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {detected.length === 0 ? (
                  <span className="text-muted-foreground">Koi topic detect nahi hua</span>
                ) : (
                  detected.map((t) => (
                    <Badge key={t.topic_slug} variant="secondary" className="text-[10px]">
                      {t.topic_label}
                    </Badge>
                  ))
                )}
              </div>
              <p className="mt-2 font-medium">
                SEO quality gate:{' '}
                <span className={quality.indexable ? 'text-emerald-500' : 'text-amber-500'}>
                  {quality.indexable ? 'indexable' : 'noindex,follow'}
                </span>{' '}
                <span className="text-muted-foreground">({quality.words} words)</span>
              </p>
              {quality.reasons.length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {quality.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementsManager;
