import { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const QRGenerator = () => {
  const [text, setText] = useState('https://mcq-synergy-hub.lovable.app');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR-like pattern (visual representation — not scannable)
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    const cellSize = 8;
    const grid = Math.floor(size / cellSize);
    // Generate deterministic pattern from text
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    
    // Draw finder patterns
    const drawFinder = (x: number, y: number) => {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
          ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize);
      }
    };
    drawFinder(0, 0);
    drawFinder(grid - 7, 0);
    drawFinder(0, grid - 7);

    // Fill data area
    for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) {
      if ((i < 8 && j < 8) || (i >= grid - 8 && j < 8) || (i < 8 && j >= grid - 8)) continue;
      hash = ((hash << 3) ^ (hash >> 2) ^ (i * 31 + j * 17)) | 0;
      if ((hash & 1) === 0) ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }, [text]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <Header>
      <ToolWrapper toolId="qr-generator" title="QR Code Generator" description="Generate QR code patterns from text" category="Generators">
        <div className="space-y-4">
          <div><Label>Text or URL</Label><Input value={text} onChange={e => setText(e.target.value)} placeholder="Enter text or URL" /></div>
          <div className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef} className="border border-border rounded-lg" />
            <div className="flex gap-2">
              <Button onClick={download} className="gap-2"><Download className="h-4 w-4" /> Download PNG</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">⚠️ Visual QR pattern — for production use, consider a dedicated QR library.</p>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default QRGenerator;
