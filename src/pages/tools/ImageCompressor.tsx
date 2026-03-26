import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, Download, RotateCcw, Image as ImageIcon, 
  Sparkles, CheckCircle2, FileImage, Zap, ArrowLeft,
  Share2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getRelatedTools } from '@/data/toolsData';

type Stage = 'upload' | 'configure' | 'processing' | 'done';

interface CompressedResult {
  blob: Blob;
  url: string;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercent: number;
  width: number;
  height: number;
  fileName: string;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageCompressor = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [quality, setQuality] = useState([75]);
  const [maxWidth, setMaxWidth] = useState([2048]);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'webp' | 'png'>('jpeg');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<CompressedResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relatedTools = getRelatedTools('image-compressor', 4);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      toast.error('File too large. Max 50MB.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStage('configure');
    setResult(null);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const compress = useCallback(async () => {
    if (!file) return;
    setStage('processing');
    setProgress(0);
    setProgressLabel('Reading image...');

    await new Promise(r => setTimeout(r, 300));
    setProgress(15);
    setProgressLabel('Decoding image...');

    const img = new window.Image();
    img.src = preview;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });

    setProgress(35);
    setProgressLabel('Resizing...');
    await new Promise(r => setTimeout(r, 200));

    const canvas = document.createElement('canvas');
    let w = img.width;
    let h = img.height;
    const max = maxWidth[0];
    if (w > max) {
      h = Math.round(h * max / w);
      w = max;
    }
    canvas.width = w;
    canvas.height = h;

    setProgress(55);
    setProgressLabel('Compressing...');
    await new Promise(r => setTimeout(r, 300));

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);

    setProgress(75);
    setProgressLabel('Encoding...');
    await new Promise(r => setTimeout(r, 200));

    const mimeType = outputFormat === 'png' ? 'image/png' : 
                     outputFormat === 'webp' ? 'image/webp' : 'image/jpeg';
    const q = outputFormat === 'png' ? undefined : quality[0] / 100;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), mimeType, q);
    });

    setProgress(92);
    setProgressLabel('Finalizing...');
    await new Promise(r => setTimeout(r, 300));

    const url = URL.createObjectURL(blob);
    const originalSize = file.size;
    const compressedSize = blob.size;
    const savedBytes = originalSize - compressedSize;
    const savedPercent = Math.round((savedBytes / originalSize) * 100);
    const ext = outputFormat === 'png' ? '.png' : outputFormat === 'webp' ? '.webp' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');

    setProgress(100);
    setProgressLabel('Done!');
    await new Promise(r => setTimeout(r, 400));

    setResult({
      blob, url, originalSize, compressedSize, savedBytes, savedPercent,
      width: w, height: h, fileName: `${baseName}-compressed${ext}`
    });
    setStage('done');
  }, [file, preview, quality, maxWidth, outputFormat]);

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.fileName;
    link.click();
    toast.success('Image downloaded!');
  };

  const shareResult = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        const f = new File([result.blob], result.fileName, { type: result.blob.type });
        await navigator.share({ files: [f], title: 'Compressed Image' });
      } catch { /* user cancelled */ }
    } else {
      toast.info('Share not supported on this browser');
    }
  };

  const reset = () => {
    setStage('upload');
    setFile(null);
    setPreview('');
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Header>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        {/* Back + Breadcrumb */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/tools')} className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to All Tools
        </Button>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
          <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span><span>Converters</span><span>/</span>
          <span className="text-foreground font-medium">Image Compressor</span>
        </nav>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <FileImage className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Image Compressor</h1>
              <p className="text-muted-foreground">Compress images up to 80% — instantly, privately, in your browser.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> Client-Side</Badge>
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> No Upload</Badge>
            <Badge variant="outline" className="gap-1">Free Forever</Badge>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
        >
          <AnimatePresence mode="wait">
            {/* === UPLOAD STAGE === */}
            {stage === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 sm:p-10"
              >
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 cursor-pointer
                    ${dragActive 
                      ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10' 
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30'
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <motion.div
                    animate={dragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-colors duration-300
                      ${dragActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Upload className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {dragActive ? 'Drop your image here!' : 'Drop image here or click to browse'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        JPG, PNG, WebP, GIF — up to 50MB
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Trust badges */}
                <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> 100% Private</span>
                  <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> Instant Processing</span>
                  <span className="flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5 text-blue-500" /> All Formats</span>
                </div>
              </motion.div>
            )}

            {/* === CONFIGURE STAGE === */}
            {stage === 'configure' && file && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="p-6 sm:p-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Preview</p>
                    <div className="relative rounded-xl border border-border/60 overflow-hidden bg-muted/30 aspect-video flex items-center justify-center">
                      <img src={preview} alt="Image preview before compression" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <FileImage className="h-4 w-4 shrink-0" />
                      <span className="truncate font-medium text-foreground">{file.name}</span>
                      <Badge variant="secondary" className="shrink-0">{formatBytes(file.size)}</Badge>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Quality</label>
                        <span className="text-sm font-bold text-primary">{quality[0]}%</span>
                      </div>
                      <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={5} className="w-full" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Smaller file</span><span>Better quality</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Max Width</label>
                        <span className="text-sm font-bold text-primary">{maxWidth[0]}px</span>
                      </div>
                      <Slider value={maxWidth} onValueChange={setMaxWidth} min={256} max={4096} step={128} className="w-full" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Output Format</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['jpeg', 'webp', 'png'] as const).map(fmt => (
                          <Button
                            key={fmt}
                            variant={outputFormat === fmt ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setOutputFormat(fmt)}
                            className="uppercase text-xs font-bold"
                          >
                            {fmt}
                          </Button>
                        ))}
                      </div>
                      {outputFormat === 'webp' && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" /> WebP typically achieves 25-35% better compression than JPEG
                        </p>
                      )}
                    </div>

                    <Button onClick={compress} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                      <Sparkles className="h-5 w-5" /> Compress Image
                    </Button>
                    <Button variant="ghost" size="sm" onClick={reset} className="w-full gap-1 text-muted-foreground">
                      <RotateCcw className="h-3.5 w-3.5" /> Choose different image
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* === PROCESSING STAGE === */}
            {stage === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-10 sm:p-16 text-center space-y-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center"
                >
                  <Sparkles className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{progressLabel}</p>
                  <Progress value={progress} className="h-3 max-w-sm mx-auto" indicatorClassName="bg-primary transition-all duration-500" />
                  <p className="text-sm text-muted-foreground">{progress}% complete</p>
                </div>
              </motion.div>
            )}

            {/* === DONE STAGE === */}
            {stage === 'done' && result && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Success header */}
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  >
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">Compression Complete!</h2>
                  {result.savedPercent > 0 ? (
                    <p className="text-muted-foreground">
                      We saved you <span className="font-bold text-green-600 dark:text-green-400">{formatBytes(result.savedBytes)}</span> ({result.savedPercent}% smaller)
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      File is already optimized! Size: {formatBytes(result.compressedSize)}
                    </p>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="text-sm font-bold text-foreground">{formatBytes(result.originalSize)}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Compressed</p>
                    <p className="text-sm font-bold text-primary">{formatBytes(result.compressedSize)}</p>
                  </div>
                  <div className="rounded-xl border border-green-300/50 dark:border-green-700/50 bg-green-50 dark:bg-green-950/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Saved</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                      {result.savedPercent > 0 ? `${result.savedPercent}%` : '—'}
                    </p>
                  </div>
                </div>

                {/* Before / After preview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground text-center py-1.5 bg-muted/50">Original</p>
                    <div className="aspect-video flex items-center justify-center p-2">
                      <img src={preview} alt="Original" className="max-w-full max-h-full object-contain rounded" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-primary/30 overflow-hidden bg-primary/5">
                    <p className="text-xs font-medium text-primary text-center py-1.5 bg-primary/10">Compressed</p>
                    <div className="aspect-video flex items-center justify-center p-2">
                      <img src={result.url} alt="Compressed" className="max-w-full max-h-full object-contain rounded" />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={downloadResult} size="lg" className="flex-1 gap-2 text-base font-semibold h-12">
                    <Download className="h-5 w-5" /> Download Compressed Image
                  </Button>
                  <Button onClick={shareResult} variant="outline" size="lg" className="gap-2 h-12">
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
                <Button variant="ghost" onClick={reset} className="w-full gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" /> Compress Another Image
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* MCQ CTA */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Students? Try our MCQ Platform!</p>
            <p className="text-sm text-muted-foreground">10,000+ free practice questions for all subjects</p>
          </div>
          <Button asChild size="sm"><Link to="/subjects">Explore MCQs →</Link></Button>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Related Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedTools.map(tool => (
                <Link
                  key={tool.id}
                  to={tool.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all text-center group"
                >
                  <tool.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-foreground">{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Header>
  );
};

export default ImageCompressor;
