import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Download, RotateCcw, FileText, Sparkles,
  CheckCircle2, Zap, ArrowLeft, GripVertical, Trash2,
  Plus, File, Merge
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { getRelatedTools } from '@/data/toolsData';

type Stage = 'upload' | 'configure' | 'processing' | 'done';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

interface MergedResult {
  blob: Blob;
  url: string;
  totalSize: number;
  mergedSize: number;
  totalPages: number;
  fileName: string;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const PDFMerger = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('upload');
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState<MergedResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);
  const relatedTools = getRelatedTools('pdf-merger', 4);

  const addFiles = useCallback(async (fileList: FileList) => {
    const { PDFDocument } = await import('pdf-lib');
    const pdfs = Array.from(fileList).filter(f => f.type === 'application/pdf').slice(0, 20);
    if (pdfs.length === 0) { toast.error('Please select PDF files'); return; }

    const newFiles: PDFFile[] = [];
    for (const f of pdfs) {
      let pageCount = 0;
      try {
        const ab = await f.arrayBuffer();
        const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
      } catch { pageCount = 0; }
      newFiles.push({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size, pageCount });
    }

    setPdfFiles(prev => {
      const combined = [...prev, ...newFiles].slice(0, 20);
      if (combined.length >= 2) setStage('configure');
      else setStage('upload');
      return combined;
    });
  }, []);

  const removeFile = (id: string) => {
    setPdfFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (next.length < 2) setStage('upload');
      return next;
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const merge = useCallback(async () => {
    if (pdfFiles.length < 2) return;
    setStage('processing');
    setProgress(0);
    setProgressLabel('Initializing...');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedDoc = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < pdfFiles.length; i++) {
        setProgressLabel(`Merging ${i + 1}/${pdfFiles.length}: ${pdfFiles[i].name}`);
        setProgress(Math.round(((i) / pdfFiles.length) * 85));

        const ab = await pdfFiles[i].file.arrayBuffer();
        const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach(page => mergedDoc.addPage(page));
        totalPages += doc.getPageCount();
      }

      setProgress(90);
      setProgressLabel('Saving merged PDF...');

      const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const totalSize = pdfFiles.reduce((a, f) => a + f.size, 0);

      setProgress(100);
      setProgressLabel('Done!');
      await new Promise(r => setTimeout(r, 400));

      setResult({
        blob, url, totalSize, mergedSize: blob.size, totalPages,
        fileName: 'merged-document.pdf'
      });
      setStage('done');
    } catch (err) {
      console.error('PDF merge error:', err);
      toast.error('Failed to merge PDFs. One or more files may be corrupted.');
      setStage('configure');
    }
  }, [pdfFiles]);

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.fileName;
    link.click();
    toast.success('Merged PDF downloaded!');
  };

  const reset = () => {
    setStage('upload'); setPdfFiles([]); setResult(null); setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalPages = pdfFiles.reduce((a, f) => a + (f.pageCount || 0), 0);

  return (
    <Header>
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tools')} className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to All Tools
        </Button>
        <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
          <Link to="/tools" className="hover:text-foreground transition-colors">Tools</Link>
          <span>/</span><span>Converters</span><span>/</span>
          <span className="text-foreground font-medium">PDF Merger</span>
        </nav>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center">
              <Merge className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">PDF Merger</h1>
              <p className="text-muted-foreground">Combine multiple PDFs into one — drag to reorder.</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> Client-Side</Badge>
            <Badge variant="outline" className="gap-1"><Sparkles className="h-3 w-3" /> Drag to Reorder</Badge>
            <Badge variant="outline" className="gap-1">Up to 20 PDFs</Badge>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <AnimatePresence mode="wait">
            {stage === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 sm:p-10">
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center transition-all duration-300 cursor-pointer
                    ${dragActive ? 'border-amber-500 bg-amber-500/5 scale-[1.01] shadow-lg shadow-amber-500/10' : 'border-muted-foreground/25 hover:border-amber-500/50 hover:bg-accent/30'}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => e.target.files?.length && addFiles(e.target.files)} />
                  <motion.div animate={dragActive ? { scale: 1.1, y: -8 } : { scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="flex flex-col items-center gap-4">
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center transition-colors duration-300 ${dragActive ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                      <Upload className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{dragActive ? 'Drop PDFs here!' : 'Drop PDFs here or click to browse'}</p>
                      <p className="text-sm text-muted-foreground mt-1">Select 2 or more PDFs to merge (up to 20)</p>
                    </div>
                  </motion.div>
                </div>

                {pdfFiles.length === 1 && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 text-center">
                    <p className="text-sm text-amber-700 dark:text-amber-300">1 file added. Add at least 1 more to merge.</p>
                  </div>
                )}

                <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> 100% Private</span>
                  <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-amber-500" /> Instant</span>
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5 text-blue-500" /> All PDFs</span>
                </div>
              </motion.div>
            )}

            {stage === 'configure' && pdfFiles.length >= 2 && (
              <motion.div key="configure" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{pdfFiles.length} PDFs • {totalPages} pages total</p>
                  <Button variant="outline" size="sm" onClick={() => addFileInputRef.current?.click()} className="gap-1">
                    <Plus className="h-3.5 w-3.5" /> Add More
                  </Button>
                  <input ref={addFileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={(e) => e.target.files?.length && addFiles(e.target.files)} />
                </div>

                <p className="text-xs text-muted-foreground">Drag items to reorder the merge sequence</p>

                <Reorder.Group axis="y" values={pdfFiles} onReorder={setPdfFiles} className="space-y-2">
                  {pdfFiles.map((pdf, i) => (
                    <Reorder.Item key={pdf.id} value={pdf} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <File className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{pdf.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(pdf.size)}{pdf.pageCount ? ` • ${pdf.pageCount} pages` : ''}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">#{i + 1}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(pdf.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <Button onClick={merge} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                  <Merge className="h-5 w-5" /> Merge {pdfFiles.length} PDFs
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} className="w-full gap-1 text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </Button>
              </motion.div>
            )}

            {stage === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-10 sm:p-16 text-center space-y-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-amber-500" />
                </motion.div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{progressLabel}</p>
                  <Progress value={progress} className="h-3 max-w-sm mx-auto" />
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
                  <h2 className="text-2xl font-bold text-foreground">PDFs Merged!</h2>
                  <p className="text-muted-foreground">{pdfFiles.length} files combined into {result.totalPages} pages</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Files</p>
                    <p className="text-sm font-bold text-foreground">{pdfFiles.length}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Pages</p>
                    <p className="text-sm font-bold text-primary">{result.totalPages}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Final Size</p>
                    <p className="text-sm font-bold text-foreground">{formatBytes(result.mergedSize)}</p>
                  </div>
                </div>

                <Button onClick={downloadResult} size="lg" className="w-full gap-2 text-base font-semibold h-12">
                  <Download className="h-5 w-5" /> Download Merged PDF
                </Button>
                <Button variant="ghost" onClick={reset} className="w-full gap-1.5 text-muted-foreground">
                  <RotateCcw className="h-4 w-4" /> Merge More PDFs
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

export default PDFMerger;
