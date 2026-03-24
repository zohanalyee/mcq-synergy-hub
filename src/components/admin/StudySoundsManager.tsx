import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Music, Upload, Trash2, Play, Pause } from "lucide-react";
import { useRef } from "react";

const CATEGORIES = [
  { value: "ambient", label: "🌧️ Ambient / Nature" },
  { value: "lofi", label: "🎵 Lo-Fi Beats" },
  { value: "focus", label: "🧠 Deep Focus" },
  { value: "classical", label: "🎹 Classical / Piano" },
];

const StudySoundsManager = () => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("ambient");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["admin-study-sounds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_audio_tracks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !title.trim()) throw new Error("Title and file required");
      setUploading(true);

      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${title.replace(/\s+/g, "-").toLowerCase()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("study-sounds")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("study-sounds").getPublicUrl(path);

      const { error: insertError } = await supabase.from("study_audio_tracks").insert({
        title: title.trim(),
        category,
        file_url: urlData.publicUrl,
        sort_order: tracks.length,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Track uploaded successfully");
      setTitle("");
      setFile(null);
      setCategory("ambient");
      queryClient.invalidateQueries({ queryKey: ["admin-study-sounds"] });
    },
    onError: (err: any) => toast.error(err.message || "Upload failed"),
    onSettled: () => setUploading(false),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("study_audio_tracks")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-study-sounds"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const track = tracks.find((t: any) => t.id === id);
      if (track) {
        const urlParts = track.file_url.split("/study-sounds/");
        if (urlParts[1]) {
          await supabase.storage.from("study-sounds").remove([urlParts[1]]);
        }
      }
      const { error } = await supabase.from("study_audio_tracks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Track deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-study-sounds"] });
    },
  });

  const togglePlay = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(id);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-violet-400" />
            Upload New Track
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Track Title</Label>
              <Input
                placeholder="e.g. Gentle Rain"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Audio File (MP3, WAV, OGG — max 20MB)</Label>
            <Input
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="h-9 text-sm"
            />
          </div>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={!title.trim() || !file || uploading}
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border-0"
            size="sm"
          >
            {uploading ? "Uploading..." : "Upload Track"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="h-4 w-4 text-primary" />
            Audio Library ({tracks.length} tracks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : tracks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracks uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {tracks.map((track: any) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-muted/30"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => togglePlay(track.file_url, track.id)}
                  >
                    {playingId === track.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {CATEGORIES.find((c) => c.value === track.category)?.label || track.category}
                    </p>
                  </div>
                  <Switch
                    checked={track.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: track.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(track.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudySoundsManager;
