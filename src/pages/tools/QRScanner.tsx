import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Upload, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const READER_ID = 'qr-reader-region';
const STORAGE = 'qr-scanner-history';

const isUrl = (s: string) => /^https?:\/\//i.test(s);

const QRScanner = () => {
  const [result, setResult] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(STORAGE) || '[]')); } catch { /* ignore */ }
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const pushHistory = (val: string) => {
    setHistory(prev => {
      const next = [val, ...prev.filter(x => x !== val)].slice(0, 5);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  };

  const startCamera = async () => {
    setError('');
    try {
      const html5 = new Html5Qrcode(READER_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      scannerRef.current = html5;
      await html5.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          setResult(decoded);
          pushHistory(decoded);
          stopCamera();
          toast.success('QR decoded');
        },
        () => { /* per-frame errors are noisy; ignore */ },
      );
      setScanning(true);
    } catch (e: any) {
      setError(e?.message || 'Camera permission denied. Allow camera access or upload an image instead.');
      setScanning(false);
    }
  };

  const stopCamera = async () => {
    try { await scannerRef.current?.stop(); } catch { /* ignore */ }
    try { await scannerRef.current?.clear(); } catch { /* ignore */ }
    scannerRef.current = null;
    setScanning(false);
  };

  const decodeFile = async (file: File) => {
    setError('');
    try {
      const html5 = new Html5Qrcode(READER_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      const decoded = await html5.scanFile(file, true);
      setResult(decoded);
      pushHistory(decoded);
      toast.success('QR decoded from image');
      try { await html5.clear(); } catch { /* ignore */ }
    } catch (e: any) {
      setError('Could not decode this image. Try a sharper photo with good lighting.');
    }
  };

  return (
    <Header>
      <ToolWrapper
        toolId="qr-scanner"
        title="QR Code Scanner"
        description="Scan QR codes with your camera or decode from an image"
        category="Generators"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {!scanning ? (
              <Button onClick={startCamera} className="gap-2"><Camera className="h-4 w-4" /> Start Camera</Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="gap-2"><CameraOff className="h-4 w-4" /> Stop</Button>
            )}
            <Button onClick={() => fileRef.current?.click()} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Image
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) decodeFile(f); e.target.value = ''; }}
            />
          </div>

          <div
            id={READER_ID}
            className="w-full max-w-md mx-auto rounded-xl overflow-hidden border border-border bg-muted/30"
            style={{ minHeight: scanning ? 280 : 0 }}
          />

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          {result && (
            <div className="p-4 rounded-xl bg-accent/30 space-y-2">
              <p className="text-xs text-muted-foreground">Decoded</p>
              <p className="text-sm font-mono break-all text-foreground">{result}</p>
              <div className="flex flex-wrap gap-2">
                <CopyButton text={result} />
                {isUrl(result) && (
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <a href={result} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
                  </Button>
                )}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Recent scans</h3>
                <Button size="sm" variant="ghost" onClick={() => { setHistory([]); localStorage.removeItem(STORAGE); }} className="gap-1.5 h-7">
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
              <ul className="space-y-1.5">
                {history.map((h, i) => (
                  <li key={i} className="text-xs font-mono break-all p-2 rounded-lg bg-muted/40 text-foreground">{h}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Scanning happens entirely in your browser. Nothing is uploaded.
          </p>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default QRScanner;
