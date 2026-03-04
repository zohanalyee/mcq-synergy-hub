import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Textarea } from '@/components/ui/textarea';

const WordCounter = () => {
  const [text, setText] = useState('');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const sentences = text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0;
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(words / 200);

  return (
    <Header>
      <ToolWrapper toolId="word-counter" title="Word Counter" description="Count words, characters, sentences" category="Productivity">
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste your text here..." rows={8} className="mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Words</p><p className="text-2xl font-bold text-foreground">{words}</p></div>
          <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Characters</p><p className="text-2xl font-bold text-foreground">{chars}</p></div>
          <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Sentences</p><p className="text-2xl font-bold text-foreground">{sentences}</p></div>
          <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Paragraphs</p><p className="text-2xl font-bold text-foreground">{paragraphs}</p></div>
          <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Read Time</p><p className="text-2xl font-bold text-foreground">{readingTime} min</p></div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default WordCounter;
