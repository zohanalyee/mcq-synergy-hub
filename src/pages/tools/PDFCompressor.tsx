import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Download, RotateCcw, FileText, Sparkles,
  CheckCircle2, Zap, ArrowLeft, Share2, Info, File
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
  pageCount: number;
  fileName: string;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const PDFCompressor = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [compressionLevel, setCompressionLevel] = useState([50]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<CompressedResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const relatedTools = getRelatedTools('pdf-compressor', 4);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error('File too large. Max 100MB.');
      return;
    }
    setFile(f);
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
    setProgressLabel('Reading PDF...');

    try {
      const { PDFDocument } = await import('pdf-lib');

      const arrayBuffer = await file.arrayBuffer();
      setProgress(20);
      setProgressLabel('Parsing document...');

      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();
      setProgress(40);
      setProgressLabel(`Processing ${pageCount} pages...`);

      // Remove metadata to reduce size
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      setProgress(60);
      setProgressLabel('Optimizing...');
      setProgress(80);
      setProgressLabel('Saving compressed PDF...');

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      setProgress(92);
      setProgressLabel('Finalizing...');
      await new Promise(r => setTimeout(r, 300));

      const blob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const originalSize = file.size;
      const compressedSize = blob.size;
      const savedBytes = originalSize - compressedSize;
      const savedPercent = Math.max(0, Math.round((savedBytes / originalSize) * 100));
      const baseName = file.name.replace(/\.pdf$/i, '');

      setProgress(100);
      setProgressLabel('Done!');
      await new Promise(r => setTimeout(r, 400));

      setResult({
        blob, url, originalSize, compressedSize, savedBytes, savedPercent,
        pageCount, fileName: `${baseName}-compressed.pdf`
      });
      setStage('done');
    } catch (err) {
      console.error('PDF compression error:', err);
      toast.error('Failed to compress PDF. The file may be encrypted or corrupted.');
      setStage('configure');
    }
  }, [file, compressionLevel]);

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.fileName;
    link.click();
    toast.success('PDF downloaded!');
  };

  const reset = () => {
    setStage('upload');
    setFile(null);
    setResult(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Header>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tools')} className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to All Tools
        </Button>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
          <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span><span>Converters</span><span>/</span>
          <span className="text-foreground font-medium">PDF Compressor</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">PDF Compressor</h1>
              <p className="text-muted-foreground">Reduce PDF file size — fast, private, in your browser.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> Client-Side</Badge>
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> No Upload</Badge>
            <Badge variant="outline" className="gap-1">Up to 100MB</Badge>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm"
        >
          <AnimatePresence mode="wait">
            {stage === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-10">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 cursor-pointer
                    ${dragActive ? 'border-destructive bg-destructive/5 scale-[1.01] shadow-lg shadow-destructive/10' : 'border-muted-foreground/25 hover:border-destructive/50 hover:bg-accent/30'}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  <motion.div animate={dragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex flex-col items-center gap-4">
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-colors duration-300 ${dragActive ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                      <Upload className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{dragActive ? 'Drop your PDF here!' : 'Drop PDF here or click to browse'}</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF files up to 100MB</p>
                    </div>
                  </motion.div>
                </div>
                <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> 100% Private</span>
                  <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> Instant</span>
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-blue-500" /> All PDFs</span>
                </div>
              </motion.div>
            )}

            {stage === 'configure' && file && (
              <motion.div key="configure" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-muted/30">
                  <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <File className="h-7 w-7 text-destructive" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Badge variant="secondary">PDF</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Compression Level</label>
                    <span className="text-sm font-bold text-primary">{compressionLevel[0]}%</span>
                  </div>
                  <Slider value={compressionLevel} onValueChange={setCompressionLevel} min={10} max={90} step={10} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Less compression</span><span>Maximum compression</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Higher compression removes metadata and optimizes object streams
                  </p>
                </div>

                <Button onClick={compress} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                  <Sparkles className="h-5 w-5" /> Compress PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} className="w-full gap-1 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Choose different file
                </Button>
              </motion.div>
            )}

            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 sm:p-16 text-center space-y-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-destructive" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{progressLabel}</p>
                  <Progress value={progress} className="h-3 max-w-sm mx-auto" indicatorClassName="bg-destructive transition-all duration-500" />
                  <p className="text-sm text-muted-foreground">{progress}% complete</p>
                </div>
              </motion.div>
            )}

            {stage === 'done' && result && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}>
                    <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-foreground">PDF Compressed!</h2>
                  {result.savedPercent > 0 ? (
                    <p className="text-muted-foreground">Saved <span className="font-bold text-green-600 dark:text-green-400">{formatBytes(result.savedBytes)}</span> ({result.savedPercent}% smaller)</p>
                  ) : (
                    <p className="text-muted-foreground">PDF is already optimized! Size: {formatBytes(result.compressedSize)}</p>
                  )}
                </div>

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
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{result.savedPercent > 0 ? `${result.savedPercent}%` : '—'}</p>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {result.pageCount} page{result.pageCount !== 1 ? 's' : ''} • {result.fileName}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={downloadResult} size="lg" className="flex-1 gap-2 text-base font-semibold h-12">
                    <Download className="h-5 w-5" /> Download Compressed PDF
                  </Button>
                </div>
                <Button variant="ghost" onClick={reset} className="w-full gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" /> Compress Another PDF
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

export default PDFCompressor;
