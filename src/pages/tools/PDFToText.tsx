import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PDFToText = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let extracted = '';
      let inText = false;
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        const ch = String.fromCharCode(bytes[i]);
        str += ch;
        if (str.endsWith('BT')) inText = true;
        if (str.endsWith('ET')) inText = false;
        if (inText && bytes[i] >= 32 && bytes[i] <= 126) extracted += ch;
      }
      setText(extracted || 'Could not extract text. The PDF may contain images only.');
    } catch {
      setText('Error reading file.');
    }
    setLoading(false);
  };

  return (
    <Header>
      <ToolWrapper toolId="pdf-to-text" title="PDF to Text" description="Extract text from PDF files (basic)" category="Converters">
        <div className="space-y-4">
          <div><Label>Upload PDF</Label><Input type="file" accept=".pdf" onChange={handleFile} /></div>
          {loading && <p className="text-sm text-muted-foreground">Processing...</p>}
          {text && (
            <>
              <Textarea value={text} readOnly rows={10} />
              <CopyButton text={text} />
            </>
          )}
          <p className="text-xs text-muted-foreground">⚠️ Basic text extraction. For complex PDFs, use the admin document pipeline.</p>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default PDFToText;
