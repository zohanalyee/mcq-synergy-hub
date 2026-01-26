import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';

const TimerTool = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');
  const [inputMinutes, setInputMinutes] = useState(5);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (mode === 'timer') {
            if (prevTime <= 0) {
              setIsRunning(false);
              return 0;
            }
            return prevTime - 1;
          }
          return prevTime + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsRunning(false);
    setTime(mode === 'timer' ? inputMinutes * 60 : 0);
  };

  const startTimer = () => {
    if (mode === 'timer' && time === 0) {
      setTime(inputMinutes * 60);
    }
    setIsRunning(true);
  };

  return (
    <Header>
      <div className="container py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 mb-4">
            <Timer className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold">Timer & Stopwatch</h1>
          <p className="text-muted-foreground">Track your study time</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <div className="flex gap-2 justify-center">
              <Button
                variant={mode === 'stopwatch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('stopwatch'); reset(); }}
              >
                Stopwatch
              </Button>
              <Button
                variant={mode === 'timer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('timer'); setTime(inputMinutes * 60); setIsRunning(false); }}
              >
                Timer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-amber-500 py-8">
                {formatTime(time)}
              </div>
            </div>
            
            {mode === 'timer' && !isRunning && time === 0 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setInputMinutes(Math.max(1, inputMinutes - 1))}>-</Button>
                <span className="w-20 text-center font-medium">{inputMinutes} min</span>
                <Button variant="outline" size="sm" onClick={() => setInputMinutes(inputMinutes + 1)}>+</Button>
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                className="w-32"
                onClick={() => isRunning ? setIsRunning(false) : startTimer()}
              >
                {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button variant="outline" size="lg" onClick={reset}>
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default TimerTool;
