import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_PLAYLISTS = [
  {
    id: "focus",
    label: "🧠 Deep Focus",
    url: "https://cdn.pixabay.com/audio/2024/11/28/audio_3e2c2a1da3.mp3",
    category: "focus",
  },
  {
    id: "lofi",
    label: "🎵 Lo-Fi Beats",
    url: "https://cdn.pixabay.com/audio/2024/06/11/audio_4abab29086.mp3",
    category: "lofi",
  },
  {
    id: "rain",
    label: "🌧️ Rain Sounds",
    url: "https://cdn.pixabay.com/audio/2022/09/08/audio_ee677fffdf.mp3",
    category: "ambient",
  },
];

const CATEGORY_EMOJI: Record<string, string> = {
  ambient: "🌧️",
  lofi: "🎵",
  focus: "🧠",
  classical: "🎹",
};

interface NeuralFocusPlayerProps {
  isOpen: boolean;
}

const NeuralFocusPlayer = ({ isOpen }: NeuralFocusPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activeTrackId, setActiveTrackId] = useState<string>("focus");

  // Fetch admin-uploaded tracks
  const { data: adminTracks = [] } = useQuery({
    queryKey: ["study-sounds-player"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_audio_tracks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Merge default + admin tracks
  const allTracks = [
    ...DEFAULT_PLAYLISTS.map((p) => ({
      id: p.id,
      label: p.label,
      url: p.url,
    })),
    ...adminTracks.map((t: any) => ({
      id: t.id,
      label: `${CATEGORY_EMOJI[t.category] || "🎶"} ${t.title}`,
      url: t.file_url,
    })),
  ];

  // Create / cleanup audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTrackChange = (trackId: string) => {
    const track = allTracks.find((t) => t.id === trackId);
    if (!track || !audioRef.current) return;

    setActiveTrackId(trackId);
    audioRef.current.src = track.url;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        const track = allTracks.find((t) => t.id === activeTrackId);
        if (track) audioRef.current.src = track.url;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-card rounded-2xl p-3 mb-2 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Study Sounds
        </span>
        {adminTracks.length > 0 && (
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            +{adminTracks.length} custom
          </Badge>
        )}
      </div>

      {/* Track chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {allTracks.map((track) => (
          <Badge
            key={track.id}
            variant={activeTrackId === track.id ? "default" : "secondary"}
            className={cn(
              "cursor-pointer text-[10px] sm:text-xs transition-all",
              activeTrackId === track.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTrackChange(track.id)}
          >
            {track.label}
          </Badge>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
          {volume === 0 ? (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <Slider
            value={[volume * 100]}
            onValueChange={([val]) => setVolume(val / 100)}
            max={100}
            step={5}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
};

export default NeuralFocusPlayer;
