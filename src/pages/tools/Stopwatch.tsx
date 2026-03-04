import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';

const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) intervalRef.current = setInterval(() => setTime(t => t + 10), 10);
    else if (intervalRef.current) clearInterval(intervalRef.current);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const format = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  return (
    <Header>
      <ToolWrapper toolId="stopwatch" title="Stopwatch" description="Simple stopwatch with lap times" category="Productivity">
        <div className="text-center space-y-6">
          <p className="text-6xl font-mono font-bold text-foreground">{format(time)}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setRunning(!running)} size="lg" className="gap-2">
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
            </Button>
            <Button variant="outline" onClick={() => setLaps([...laps, time])} disabled={!running} size="lg" className="gap-2"><Flag className="h-4 w-4" /> Lap</Button>
            <Button variant="outline" onClick={() => { setRunning(false); setTime(0); setLaps([]); }} size="lg" className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
          </div>
          {laps.length > 0 && (
            <div className="space-y-1 max-w-xs mx-auto">
              {laps.map((lap, i) => (
                <div key={i} className="flex justify-between text-sm p-2 rounded bg-accent/30">
                  <span className="text-muted-foreground">Lap {i + 1}</span>
                  <span className="font-mono font-medium text-foreground">{format(lap)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default Stopwatch;
