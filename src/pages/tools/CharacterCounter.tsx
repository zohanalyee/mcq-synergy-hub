import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Textarea } from '@/components/ui/textarea';

const CharacterCounter = () => {
  const [text, setText] = useState('');
  const total = text.length;
  const noSpaces = text.replace(/\s/g, '').length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const digits = (text.match(/\d/g) || []).length;
  const special = total - letters - digits - (text.match(/\s/g) || []).length;
  const upper = (text.match(/[A-Z]/g) || []).length;
  const lower = (text.match(/[a-z]/g) || []).length;

  return (
    <Header>
      <ToolWrapper toolId="character-counter" title="Character Counter" description="Detailed character analysis" category="Productivity">
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste text..." rows={6} className="mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Total', total], ['No Spaces', noSpaces], ['Letters', letters], ['Digits', digits],
            ['Special', special], ['Uppercase', upper], ['Lowercase', lower], ['Spaces', total - noSpaces],
          ].map(([label, val]) => (
            <div key={label as string} className="p-3 rounded-xl bg-accent/30 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{val}</p>
            </div>
          ))}
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default CharacterCounter;
