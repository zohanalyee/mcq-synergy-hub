import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Share2, Link2 } from 'lucide-react';
import { toast } from 'sonner';

type ECL = 'L' | 'M' | 'Q' | 'H';

const QRGenerator = () => {
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get('t') || 'https://www.mcqsai.com');
  const [size, setSize] = useState(Number(params.get('s')) || 320);
  const [ecl, setEcl] = useState<ECL>((params.get('e') as ECL) || 'M');
  const [fg, setFg] = useState(params.get('fg') || '#0f172a');
  const [bg, setBg] = useState(params.get('bg') || '#ffffff');
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svg, setSvg] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text) { setDataUrl(''); setSvg(''); return; }
    const opts = { errorCorrectionLevel: ecl, margin: 2, width: size, color: { dark: fg, light: bg } };
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, text, opts).catch(() => {});
    }
    QRCode.toDataURL(text, opts).then(setDataUrl).catch(() => setDataUrl(''));
    QRCode.toString(text, { ...opts, type: 'svg' }).then(setSvg).catch(() => setSvg(''));
  }, [text, size, ecl, fg, bg]);

  // Mirror state into the URL so users can share/bookmark a specific QR config.
  useEffect(() => {
    const next = new URLSearchParams();
    if (text) next.set('t', text);
    if (size !== 320) next.set('s', String(size));
    if (ecl !== 'M') next.set('e', ecl);
    if (fg !== '#0f172a') next.set('fg', fg);
    if (bg !== '#ffffff') next.set('bg', bg);
    setParams(next, { replace: true });
  }, [text, size, ecl, fg, bg, setParams]);

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied — share to reproduce this QR');
    } catch { toast.error('Could not copy link'); }
  };

  const downloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qr-code.png';
    a.click();
  };

  const downloadSvg = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    try {
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'qr-code.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'QR Code', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Text copied — share manually');
      }
    } catch { /* user cancel */ }
  };

  return (
    <Header>
      <ToolWrapper
        toolId="qr-generator"
        title="QR Code Generator"
        description="Generate real, scannable QR codes from text or URLs"
        category="Generators"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="qr-text">Text or URL</Label>
            <Input id="qr-text" value={text} onChange={e => setText(e.target.value)} placeholder="Enter text or URL" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Size</Label>
              <Select value={String(size)} onValueChange={v => setSize(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">Small (200)</SelectItem>
                  <SelectItem value="320">Medium (320)</SelectItem>
                  <SelectItem value="512">Large (512)</SelectItem>
                  <SelectItem value="1024">XL (1024)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Error correction</Label>
              <Select value={ecl} onValueChange={v => setEcl(v as ECL)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qr-fg">Foreground</Label>
              <Input id="qr-fg" type="color" value={fg} onChange={e => setFg(e.target.value)} className="h-10 p-1" />
            </div>
            <div>
              <Label htmlFor="qr-bg">Background</Label>
              <Input id="qr-bg" type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-10 p-1" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="rounded-xl border border-border bg-white p-3 inline-block">
              <canvas ref={canvasRef} aria-label="Generated QR code" />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={downloadPng} className="gap-2" disabled={!dataUrl}>
                <Download className="h-4 w-4" /> PNG
              </Button>
              <Button onClick={downloadSvg} variant="outline" className="gap-2" disabled={!svg}>
                <Download className="h-4 w-4" /> SVG
              </Button>
              <Button onClick={share} variant="outline" className="gap-2" disabled={!dataUrl}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <CopyButton text={text} />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-md">
              Real QR (Reed–Solomon). Scan with any phone camera. Higher error correction = more scannable when scratched or printed small.
            </p>
          </div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default QRGenerator;
