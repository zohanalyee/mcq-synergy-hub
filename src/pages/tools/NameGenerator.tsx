import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIRST_NAMES = ['Ahmed', 'Ali', 'Fatima', 'Ayesha', 'Hassan', 'Zainab', 'Muhammad', 'Sara', 'Omar', 'Hira', 'Bilal', 'Maryam', 'Usman', 'Amina', 'Imran', 'Nadia', 'James', 'Emma', 'Noah', 'Olivia', 'Liam', 'Sophia', 'Ethan', 'Isabella'];
const LAST_NAMES = ['Khan', 'Ali', 'Ahmed', 'Malik', 'Shah', 'Raza', 'Hussain', 'Iqbal', 'Butt', 'Siddiqui', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson'];

const NameGenerator = () => {
  const [gender, setGender] = useState('any');
  const [count, setCount] = useState('5');
  const [names, setNames] = useState<string[]>([]);

  const generate = useCallback(() => {
    const n = parseInt(count) || 5;
    const result: string[] = [];
    for (let i = 0; i < n; i++) {
      const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      result.push(`${first} ${last}`);
    }
    setNames(result);
  }, [count]);

  return (
    <Header>
      <ToolWrapper toolId="name-generator" title="Random Name Generator" description="Generate random names" category="Generators">
        <div className="flex flex-wrap gap-4 mb-4">
          <div><Label>Count</Label>
            <Select value={count} onValueChange={setCount}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent>{['1','3','5','10','20'].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent></Select>
          </div>
          <Button onClick={generate} className="self-end gap-2"><RefreshCw className="h-4 w-4" /> Generate</Button>
        </div>
        <AnimatePresence>
          {names.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {names.map((name, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                  <span className="font-medium text-foreground">{name}</span>
                  <CopyButton text={name} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default NameGenerator;
