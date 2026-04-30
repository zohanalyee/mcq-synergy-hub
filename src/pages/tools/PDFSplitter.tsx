import { useState, useCallback } from 'react';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scissors, Upload, Download, FileText, X, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SplitRange {
  id: string;
  from: number;
  to: number;
}

const PDFSplitter = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [ranges, setRanges] = useState<SplitRange[]>([{ id: '1', from: 1, to: 1 }]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; blob: Blob; pages: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const loadPDF = useCallback(async (f: File) => {
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const count = pdf.getPageCount();
      setFile(f);
      setPageCount(count);
      setRanges([{ id: '1', from: 1, to: count }]);
      setResults([]);
    } catch {
      toast.error('Could not read PDF. The file may be corrupted.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') loadPDF(f);
    else toast.error('Please drop a PDF file.');
  }, [loadPDF]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadPDF(f);
  };

  const addRange = () => {
    setRanges(prev => [...prev, { id: Date.now().toString(), from: 1, to: pageCount }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) setRanges(prev => prev.filter(r => r.id !== id));
  };

  const updateRange = (id: string, field: 'from' | 'to', value: number) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: Math.max(1, Math.min(pageCount, value)) } : r));
  };

  const splitPDF = async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newResults: { name: string; blob: Blob; pages: number }[] = [];
      const baseName = file.name.replace('.pdf', '');

      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        const from = Math.max(1, Math.min(range.from, range.to));
        const to = Math.min(pageCount, Math.max(range.from, range.to));
        
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: to - from + 1 }, (_, idx) => from - 1 + idx);
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const bytes = await newPdf.save();
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        newResults.push({
          name: `${baseName}_pages_${from}-${to}.pdf`,
          blob,
          pages: to - from + 1,
        });
      }

      setResults(newResults);
      toast.success(`Split into ${newResults.length} PDF(s) successfully!`);
    } catch {
      toast.error('Failed to split PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = (result: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => results.forEach(downloadResult);

  const reset = () => {
    setFile(null);
    setPageCount(0);
    setRanges([{ id: '1', from: 1, to: 1 }]);
    setResults([]);
  };

  return (
    <ToolWrapper
      toolId="pdf-splitter"
      title="PDF Splitter"
      description="Split PDF files into smaller documents by page ranges — fast, free & private."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/50">
          <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
          <div className="text-sm text-cyan-800 dark:text-cyan-200">
            <p className="font-medium">100% Client-Side Processing</p>
            <p className="text-cyan-600 dark:text-cyan-400">Your PDFs never leave your device. All splitting happens in your browser.</p>
          </div>
        </div>

        {/* Upload */}
        {!file ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
              ${dragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}`}
          >
            <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-foreground">Drop a PDF here or click to upload</p>
            <p className="text-sm text-muted-foreground mt-1">Max 50MB • All processing in-browser</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* File info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{pageCount} pages • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={reset}><X className="h-4 w-4" /></Button>
            </div>

            {/* Ranges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Page Ranges</Label>
                <Button variant="outline" size="sm" onClick={addRange}>+ Add Range</Button>
              </div>
              <AnimatePresence>
                {ranges.map((range, idx) => (
                  <motion.div
                    key={range.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <Badge variant="secondary" className="shrink-0">Part {idx + 1}</Badge>
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="text-xs text-muted-foreground shrink-0">From</Label>
                      <Input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.from}
                        onChange={e => updateRange(range.id, 'from', parseInt(e.target.value) || 1)}
                        className="h-8 w-20 text-center"
                      />
                      <Label className="text-xs text-muted-foreground shrink-0">To</Label>
                      <Input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={range.to}
                        onChange={e => updateRange(range.id, 'to', parseInt(e.target.value) || 1)}
                        className="h-8 w-20 text-center"
                      />
                      <span className="text-xs text-muted-foreground">of {pageCount}</span>
                    </div>
                    {ranges.length > 1 && (
                      <Button variant="ghost" size="icon-sm" onClick={() => removeRange(range.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Split button */}
            <Button onClick={splitPDF} disabled={processing} className="w-full h-12 text-base gap-2">
              {processing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Scissors className="h-5 w-5" />
                </motion.div>
              ) : (
                <Scissors className="h-5 w-5" />
              )}
              {processing ? 'Splitting...' : 'Split PDF'}
            </Button>

            {/* Results */}
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold text-sm">{results.length} file(s) ready</span>
                    </div>
                    {results.length > 1 && (
                      <Button variant="outline" size="sm" onClick={downloadAll} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download All
                      </Button>
                    )}
                  </div>
                  {results.map((result, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/60 dark:border-green-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{result.name}</p>
                          <p className="text-xs text-muted-foreground">{result.pages} pages • {(result.blob.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => downloadResult(result)} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default PDFSplitter;
