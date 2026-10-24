import { Link } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { getPracticePdfByExam } from '@/lib/practicePdfs';
import { trackPdfDownload } from '@/lib/growthEvents';

/** Static "Free practice PDF" box for hubs and mock-test pages. */
export default function PracticePdfBox({ exam, placement }: { exam: 'nthp' | 'sthp'; placement: 'hub' | 'mock_test' }) {
  const pdf = getPracticePdfByExam(exam);
  if (!pdf) return null;
  return (
    <aside className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <FileDown className="w-6 h-6 text-primary shrink-0" aria-hidden />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-foreground">Free practice PDFs: {pdf.sets.length} sets of 50 {pdf.examLabel} questions with answer key</p>
        <p className="text-muted-foreground">Unofficial MCQsAI practice set based on the published syllabus.</p>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link to={`/pdf/${pdf.slug}#sets`} className="font-medium text-primary hover:underline">All {pdf.sets.length} {pdf.examLabel} PDF sets</Link>
        <a href={pdf.sets[0].file} download className="font-medium text-primary hover:underline" onClick={() => trackPdfDownload(exam, placement, pdf.sets[0].key)}>Download {pdf.sets[0].label}</a>
      </div>
    </aside>
  );
}
