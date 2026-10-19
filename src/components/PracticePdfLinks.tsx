import { Link } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import { PRACTICE_PDFS } from '@/lib/practicePdfs';

/** Small static row linking every free practice PDF landing page. */
export default function PracticePdfLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${className}`}>
      <span className="inline-flex items-center gap-1 font-medium text-foreground"><FileDown className="w-4 h-4 text-primary" />Free practice PDFs:</span>
      {PRACTICE_PDFS.map((p) => (
        <Link key={p.slug} to={`/pdf/${p.slug}`} className="text-primary hover:underline">{p.examLabel} practice questions PDF</Link>
      ))}
    </p>
  );
}
