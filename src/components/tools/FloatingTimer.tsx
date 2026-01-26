import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const FloatingTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="space-y-4 text-center">
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-3xl font-mono font-bold tracking-wider">
          {formatTime(time)}
        </p>
      </div>
      
      <div className="flex justify-center gap-2">
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className="gap-1"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="outline" size="sm" onClick={reset} className="gap-1">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default FloatingTimer;
