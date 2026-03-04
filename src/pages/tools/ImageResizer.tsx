import { useState, useRef } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';

const ImageResizer = () => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [origSize, setOrigSize] = useState({ w: 0, h: 0 });
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [keepRatio, setKeepRatio] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const image = new window.Image();
    image.onload = () => { setImg(image); setOrigSize({ w: image.width, h: image.height }); setWidth(image.width.toString()); setHeight(image.height.toString()); };
    image.src = URL.createObjectURL(file);
  };

  const handleWidthChange = (v: string) => {
    setWidth(v);
    if (keepRatio && origSize.w > 0) setHeight(Math.round(parseInt(v) * origSize.h / origSize.w).toString());
  };

  const download = () => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = parseInt(width) || origSize.w;
    const h = parseInt(height) || origSize.h;
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
    const link = document.createElement('a');
    link.download = 'resized-image.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Header>
      <ToolWrapper toolId="image-resizer" title="Image Resizer" description="Resize images in your browser" category="Converters">
        <div className="space-y-4">
          <div><Label>Upload Image</Label><Input type="file" accept="image/*" onChange={handleFile} /></div>
          {img && (
            <>
              <p className="text-sm text-muted-foreground">Original: {origSize.w} × {origSize.h}px</p>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Width (px)</Label><Input type="number" value={width} onChange={e => handleWidthChange(e.target.value)} /></div>
                <div><Label>Height (px)</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} /></div>
              </div>
              <Button onClick={download} className="gap-2"><Download className="h-4 w-4" /> Download Resized</Button>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default ImageResizer;
