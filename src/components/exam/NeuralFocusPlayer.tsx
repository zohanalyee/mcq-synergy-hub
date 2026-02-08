import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Free royalty-free ambient audio URLs (replace with your own)
const PLAYLISTS = [
  {
    id: "focus",
    label: "🧠 Deep Focus",
    url: "https://cdn.pixabay.com/audio/2024/11/28/audio_3e2c2a1da3.mp3",
  },
  {
    id: "lofi",
    label: "🎵 Lo-Fi Beats",
    url: "https://cdn.pixabay.com/audio/2024/06/11/audio_4abab29086.mp3",
  },
  {
    id: "rain",
    label: "🌧️ Rain Sounds",
    url: "https://cdn.pixabay.com/audio/2022/09/08/audio_ee677fffdf.mp3",
  },
] as const;

interface NeuralFocusPlayerProps {
  isOpen: boolean;
}

const NeuralFocusPlayer = ({ isOpen }: NeuralFocusPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activePlaylist, setActivePlaylist] = useState<string>("focus");

  // Create / update audio element
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

  const handlePlaylistChange = (playlistId: string) => {
    const playlist = PLAYLISTS.find((p) => p.id === playlistId);
    if (!playlist || !audioRef.current) return;

    setActivePlaylist(playlistId);
    audioRef.current.src = playlist.url;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
      // Autoplay blocked
      setIsPlaying(false);
    });
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If no src yet, load the active playlist
      if (!audioRef.current.src || audioRef.current.src === window.location.href) {
        const playlist = PLAYLISTS.find((p) => p.id === activePlaylist);
        if (playlist) audioRef.current.src = playlist.url;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-card rounded-2xl p-3 mb-2 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Neural Focus
        </span>
      </div>

      {/* Playlist chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PLAYLISTS.map((playlist) => (
          <Badge
            key={playlist.id}
            variant={activePlaylist === playlist.id ? "default" : "secondary"}
            className={cn(
              "cursor-pointer text-[10px] sm:text-xs transition-all",
              activePlaylist === playlist.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => handlePlaylistChange(playlist.id)}
          >
            {playlist.label}
          </Badge>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
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
