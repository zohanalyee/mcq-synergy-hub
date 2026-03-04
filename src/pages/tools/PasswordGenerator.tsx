import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PasswordGenerator = () => {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');

  const generate = useCallback(() => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;
    let pw = '';
    for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pw);
  }, [length, upper, lower, numbers, symbols]);

  const strength = password.length >= 16 && symbols && numbers ? 'Strong' : password.length >= 12 ? 'Good' : password.length >= 8 ? 'Fair' : 'Weak';

  return (
    <Header>
      <ToolWrapper toolId="password-generator" title="Password Generator" description="Generate strong, secure passwords" category="Generators">
        <div className="space-y-6">
          <div>
            <Label>Length: {length}</Label>
            <Slider value={[length]} onValueChange={v => setLength(v[0])} min={4} max={64} step={1} className="mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between"><Label>Uppercase</Label><Switch checked={upper} onCheckedChange={setUpper} /></div>
            <div className="flex items-center justify-between"><Label>Lowercase</Label><Switch checked={lower} onCheckedChange={setLower} /></div>
            <div className="flex items-center justify-between"><Label>Numbers</Label><Switch checked={numbers} onCheckedChange={setNumbers} /></div>
            <div className="flex items-center justify-between"><Label>Symbols</Label><Switch checked={symbols} onCheckedChange={setSymbols} /></div>
          </div>
          <Button onClick={generate} className="w-full gap-2"><RefreshCw className="h-4 w-4" /> Generate Password</Button>
          {password && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-lg font-mono font-bold text-foreground break-all">{password}</p>
              <p className={`text-sm font-medium ${strength === 'Strong' ? 'text-green-500' : strength === 'Good' ? 'text-blue-500' : strength === 'Fair' ? 'text-orange-500' : 'text-red-500'}`}>Strength: {strength}</p>
              <CopyButton text={password} />
            </motion.div>
          )}
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default PasswordGenerator;
