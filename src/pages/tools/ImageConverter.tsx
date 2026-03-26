import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Download, RotateCcw, Sparkles, CheckCircle2,
  Zap, ArrowLeft, Image as ImageIcon, ArrowRight, Info, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getRelatedTools } from '@/data/toolsData';

type Stage = 'upload' | 'configure' | 'processing' | 'done';
type Format = 'jpeg' | 'png' | 'webp';

interface ConvertedFile {
  original: { name: string; size: number; type: string; previewUrl: string };
  converted: { blob: Blob; url: string; size: number; fileName: string };
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const MIME_MAP: Record<Format, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const EXT_MAP: Record<Format, string> = { jpeg: '.jpg', png: '.png', webp: '.webp' };

const ImageConverter = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [outputFormat, setOutputFormat] = useState<Format>('webp');
  const [quality, setQuality] = useState([85]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [results, setResults] = useState<ConvertedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relatedTools = getRelatedTools('image-converter', 4);

  const handleFiles = useCallback((fileList: FileList) => {
    const imageFiles = Array.from(fileList).filter(f => f.type.startsWith('image/')).slice(0, 20);
    if (imageFiles.length === 0) { toast.error('No valid images selected'); return; }
    setFiles(imageFiles);
    setPreviews(imageFiles.map(f => URL.createObjectURL(f)));
    setStage('configure');
    setResults([]);
  }, []);

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    if (newFiles.length === 0) { reset(); return; }
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const convert = useCallback(async () => {
    if (files.length === 0) return;
    setStage('processing');
    setProgress(0);

    const converted: ConvertedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgressLabel(`Converting ${i + 1}/${files.length}: ${file.name}`);
      setProgress(Math.round(((i) / files.length) * 90));

      const img = new window.Image();
      img.src = previews[i];
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);

      const q = outputFormat === 'png' ? undefined : quality[0] / 100;
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), MIME_MAP[outputFormat], q);
      });

      const baseName = file.name.replace(/\.[^.]+$/, '');
      converted.push({
        original: { name: file.name, size: file.size, type: file.type, previewUrl: previews[i] },
        converted: {
          blob, url: URL.createObjectURL(blob), size: blob.size,
          fileName: `${baseName}${EXT_MAP[outputFormat]}`
        }
      });
    }

    setProgress(100);
    setProgressLabel('Done!');
    await new Promise(r => setTimeout(r, 400));
    setResults(converted);
    setStage('done');
  }, [files, previews, outputFormat, quality]);

  const downloadAll = () => {
    results.forEach(r => {
      const link = document.createElement('a');
      link.href = r.converted.url;
      link.download = r.converted.fileName;
      link.click();
    });
    toast.success(`${results.length} image${results.length > 1 ? 's' : ''} downloaded!`);
  };

  const downloadOne = (r: ConvertedFile) => {
    const link = document.createElement('a');
    link.href = r.converted.url;
    link.download = r.converted.fileName;
    link.click();
  };

  const reset = () => {
    setStage('upload'); setFiles([]); setPreviews([]); setResults([]); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalOriginal = results.reduce((a, r) => a + r.original.size, 0);
  const totalConverted = results.reduce((a, r) => a + r.converted.size, 0);

  return (
    <Header>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tools')} className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to All Tools
        </Button>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
          <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span><span>Converters</span><span>/</span>
          <span className="text-foreground font-medium">Image Converter</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/20 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Image Converter</h1>
              <p className="text-muted-foreground">Convert images between JPG, PNG & WebP — batch support included.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> Batch Convert</Badge>
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> No Upload</Badge>
            <Badge variant="outline" className="gap-1">Up to 20 files</Badge>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            {stage === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-10">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 cursor-pointer
                    ${dragActive ? 'border-violet-500 bg-violet-500/5 scale-[1.01] shadow-lg shadow-violet-500/10' : 'border-muted-foreground/25 hover:border-violet-500/50 hover:bg-accent/30'}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />
                  <motion.div animate={dragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex flex-col items-center gap-4">
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-colors duration-300 ${dragActive ? 'bg-violet-500/20 text-violet-500' : 'bg-muted text-muted-foreground'}`}>
                      <Upload className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{dragActive ? 'Drop images here!' : 'Drop images here or click to browse'}</p>
                      <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP, GIF — up to 20 files at once</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {stage === 'configure' && files.length > 0 && (
              <motion.div key="configure" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-6 sm:p-8 space-y-6">
                {/* File list */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/40 bg-muted/20">
                      <img src={previews[i]} alt={f.name} className="h-10 w-10 rounded object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{files.length} file{files.length > 1 ? 's' : ''} selected</p>

                {/* Format */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Convert to</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['jpeg', 'png', 'webp'] as const).map(fmt => (
                      <Button key={fmt} variant={outputFormat === fmt ? 'default' : 'outline'} size="sm" onClick={() => setOutputFormat(fmt)} className="uppercase text-xs font-bold">
                        {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                {outputFormat !== 'png' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Quality</label>
                      <span className="text-sm font-bold text-primary">{quality[0]}%</span>
                    </div>
                    <Slider value={quality} onValueChange={setQuality} min={10} max={100} step={5} />
                  </div>
                )}

                {outputFormat === 'webp' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" /> WebP achieves 25-35% better compression than JPEG</p>
                )}

                <Button onClick={convert} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                  <ArrowRight className="h-5 w-5" /> Convert {files.length} Image{files.length > 1 ? 's' : ''}
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} className="w-full gap-1 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </Button>
              </motion.div>
            )}

            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 sm:p-16 text-center space-y-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-16 w-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-violet-500" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{progressLabel}</p>
                  <Progress value={progress} className="h-3 max-w-sm mx-auto" />
                  <p className="text-sm text-muted-foreground">{progress}% complete</p>
                </div>
              </motion.div>
            )}

            {stage === 'done' && results.length > 0 && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">Conversion Complete!</h2>
                  <p className="text-muted-foreground">{results.length} image{results.length > 1 ? 's' : ''} converted to {outputFormat.toUpperCase()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Original</p>
                    <p className="text-sm font-bold text-foreground">{formatBytes(totalOriginal)}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Converted</p>
                    <p className="text-sm font-bold text-primary">{formatBytes(totalConverted)}</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border/40 bg-muted/20">
                      <img src={r.converted.url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{r.converted.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(r.original.size)} → {formatBytes(r.converted.size)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => downloadOne(r)} className="gap-1 shrink-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={downloadAll} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                  <Download className="h-5 w-5" /> Download All ({results.length})
                </Button>
                <Button variant="ghost" onClick={reset} className="w-full gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" /> Convert More Images
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-foreground">Students? Try our MCQ Platform!</p>
            <p className="text-sm text-muted-foreground">10,000+ free practice questions for all subjects</p>
          </div>
          <Button asChild size="sm"><Link to="/subjects">Explore MCQs →</Link></Button>
        </div>

        {relatedTools.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Related Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedTools.map(tool => (
                <Link key={tool.id} to={tool.href} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all text-center group">
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

export default ImageConverter;
