import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import AIGeneratePanel, { GeneratedDraft } from "./blog/AIGeneratePanel";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  tags: string[];
  image_url: string | null;
  author_name: string;
  status: string;
  published_at: string | null;
  created_at: string;
  meta_title: string | null;
  meta_description: string | null;
  highlights?: any;
  structured_tables?: any;
  faqs?: any;
  internal_links?: any;
  prep_blocks?: any;
  sources?: any;
  jobposting?: any;
  schema_type?: string | null;
  reading_time_minutes?: number | null;
  last_updated_at?: string | null;
  og_title?: string | null;
  twitter_title?: string | null;
}

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  category: "",
  image_url: "",
  author_name: "MCQSAI Editorial Team",
  status: "draft" as string,
  meta_title: "",
  meta_description: "",
  og_title: "",
  twitter_title: "",
  tags: [] as string[],
  highlights: null as any,
  structured_tables: [] as any[],
  faqs: [] as any[],
  internal_links: [] as any[],
  prep_blocks: [] as any[],
  sources: [] as any[],
  jobposting: null as any,
  schema_type: "Article" as string,
  reading_time_minutes: null as number | null,
  last_updated_at: null as string | null,
};

const BlogManager = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const applyDraft = (draft: GeneratedDraft) => {
    setForm((f) => ({
      ...f,
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      content: draft.content,
      category: draft.category,
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
      og_title: (draft as any).og_title || draft.meta_title,
      twitter_title: (draft as any).twitter_title || draft.meta_title,
      tags: Array.isArray(draft.tags) ? [...draft.tags] : [],
      highlights: (draft as any).highlights ?? null,
      structured_tables: (draft as any).tables ?? [],
      faqs: (draft as any).faqs ?? [],
      internal_links: (draft as any).internal_links ?? [],
      prep_blocks: (draft as any).prep_blocks ?? [],
      sources: (draft as any).sources ?? [],
      jobposting: (draft as any).jobposting ?? null,
      schema_type: (draft as any).schema_type ?? "Article",
      reading_time_minutes: (draft as any).reading_time_minutes ?? null,
      last_updated_at: (draft as any).last_updated_iso ?? new Date().toISOString(),
    }));
    toast.success(`Draft applied — ${Array.isArray(draft.tags) ? draft.tags.length : 0} tags, ${((draft as any).faqs?.length) || 0} FAQs`);
  };

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BlogPost[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (post: typeof form & { id?: string }) => {
      const { id, ...rest } = post;
      const payload: any = {
        ...rest,
        tags: Array.isArray(rest.tags) ? rest.tags : [],
        published_at: rest.status === "published" ? new Date().toISOString() : null,
        last_updated_at: rest.last_updated_at || new Date().toISOString(),
      };
      if (id) {
        const { error } = await supabase.from("blog_posts" as any).update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Blog post saved!");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    },
  });

  const resetForm = () => {
    setEditing(null);
    setIsCreating(false);
    setForm({ ...emptyForm });
  };

  const startEdit = (post: BlogPost) => {
    setEditing(post);
    setIsCreating(true);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      category: post.category || "",
      image_url: post.image_url || "",
      author_name: post.author_name,
      status: post.status,
      meta_title: post.meta_title || "",
      meta_description: post.meta_description || "",
      og_title: post.og_title || "",
      twitter_title: post.twitter_title || "",
      tags: post.tags || [],
      highlights: post.highlights ?? null,
      structured_tables: Array.isArray(post.structured_tables) ? post.structured_tables : [],
      faqs: Array.isArray(post.faqs) ? post.faqs : [],
      internal_links: Array.isArray(post.internal_links) ? post.internal_links : [],
      prep_blocks: Array.isArray(post.prep_blocks) ? post.prep_blocks : [],
      sources: Array.isArray(post.sources) ? post.sources : [],
      jobposting: post.jobposting ?? null,
      schema_type: post.schema_type || "Article",
      reading_time_minutes: post.reading_time_minutes ?? null,
      last_updated_at: post.last_updated_at ?? null,
    });
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = () => {
    if (!form.title || !form.slug) return toast.error("Title and slug are required");
    saveMutation.mutate({ ...form, id: editing?.id });
  };

  if (isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Post" : "New Blog Post"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editing && <AIGeneratePanel onApplyDraft={applyDraft} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: editing ? form.slug : generateSlug(e.target.value) });
                }}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="jobs, mdcat, css, scholarships…" />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Excerpt</Label>
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Content (Markdown)</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={14} className="font-mono text-xs" />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={form.tags.join(", ")}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
              placeholder="mdcat-preparation, biology-mcqs, nts-jobs"
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>)}
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Meta Title</Label>
              <Input value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Input value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
            </div>
            <div>
              <Label>OG Title</Label>
              <Input value={form.og_title} onChange={(e) => setForm({ ...form, og_title: e.target.value })} />
            </div>
            <div>
              <Label>Twitter Title</Label>
              <Input value={form.twitter_title} onChange={(e) => setForm({ ...form, twitter_title: e.target.value })} />
            </div>
          </div>

          {/* Structured-bundle preview */}
          {(form.highlights || (form.faqs?.length ?? 0) || (form.internal_links?.length ?? 0) || (form.sources?.length ?? 0) || (form.structured_tables?.length ?? 0)) ? (
            <Card className="p-3 bg-muted/40 border-dashed">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">AI-generated bundle (saved with post)</p>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {form.highlights?.items?.length ? <Badge variant="outline">Highlights · {form.highlights.items.length}</Badge> : null}
                {form.structured_tables?.length ? <Badge variant="outline">Tables · {form.structured_tables.length}</Badge> : null}
                {form.faqs?.length ? <Badge variant="outline">FAQs · {form.faqs.length}</Badge> : null}
                {form.internal_links?.length ? <Badge variant="outline">Internal links · {form.internal_links.length}</Badge> : null}
                {form.prep_blocks?.length ? <Badge variant="outline">Prep blocks · {form.prep_blocks.length}</Badge> : null}
                {form.sources?.length ? <Badge variant="outline">Sources · {form.sources.length}</Badge> : null}
                {form.jobposting ? <Badge variant="outline">JobPosting schema</Badge> : null}
                {form.reading_time_minutes ? <Badge variant="outline">{form.reading_time_minutes} min read</Badge> : null}
                <Badge variant="outline">Schema: {form.schema_type}</Badge>
              </div>
            </Card>
          ) : null}

          <div className="flex items-center gap-3">
            <Switch
              checked={form.status === "published"}
              onCheckedChange={(c) => setForm({ ...form, status: c ? "published" : "draft" })}
            />
            <Label>Published</Label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog Posts ({posts.length})</h2>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />New Post
        </Button>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                      {post.status}
                    </Badge>
                    {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
                    {post.tags?.length ? <span className="text-[11px] text-muted-foreground">{post.tags.length} tags</span> : null}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(post.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(post)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => window.open(`/blog/${post.slug}`, "_blank")}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogManager;
