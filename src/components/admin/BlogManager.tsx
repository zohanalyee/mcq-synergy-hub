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
}

const BlogManager = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "",
    image_url: "",
    author_name: "MCQSAI Team",
    status: "draft" as string,
    meta_title: "",
    meta_description: "",
    tags: [] as string[],
  });

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
      tags: draft.tags || [],
    }));
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
      const payload = {
        ...post,
        published_at: post.status === "published" ? new Date().toISOString() : null,
      };
      if (post.id) {
        const { error } = await supabase
          .from("blog_posts" as any)
          .update(payload as any)
          .eq("id", post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blog_posts" as any)
          .insert(payload as any);
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
      const { error } = await supabase
        .from("blog_posts" as any)
        .delete()
        .eq("id", id);
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
    setForm({ title: "", slug: "", content: "", excerpt: "", category: "", image_url: "", author_name: "MCQSAI Team", status: "draft", meta_title: "", meta_description: "" });
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
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. preparation, tips" />
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
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} className="font-mono text-xs" />
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
          </div>
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
