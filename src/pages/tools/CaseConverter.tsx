import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const CaseConverter = () => {
  const [text, setText] = useState('');
  const convert = (fn: (s: string) => string) => setText(fn(text));

  return (
    <Header>
      <ToolWrapper toolId="case-converter" title="Text Case Converter" description="Convert text between different case styles" category="Converters">
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste your text here..." rows={5} className="mb-4" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => convert(s => s.toUpperCase())}>UPPERCASE</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.toLowerCase())}>lowercase</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))}>Title Case</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())}>Sentence case</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''))}>tOGGLE cASE</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.toLowerCase().replace(/\s+/g, '-'))}>kebab-case</Button>
          <Button variant="outline" size="sm" onClick={() => convert(s => s.toLowerCase().replace(/\s+/g, '_'))}>snake_case</Button>
        </div>
        {text && <div className="mt-4 flex justify-end"><CopyButton text={text} /></div>}
      </ToolWrapper>
    </Header>
  );
};
export default CaseConverter;
