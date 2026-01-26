import { Calculator } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const MathTool = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const handleButton = (btn: string) => {
    if (btn >= '0' && btn <= '9') inputDigit(btn);
    else if (btn === '.') inputDecimal();
    else if (btn === 'C') clear();
    else if (btn === '=') handleEquals();
    else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
    else if (btn === '±') setDisplay(String(-parseFloat(display)));
    else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
  };

  return (
    <Header>
      <div className="container py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
            <Calculator className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Math Calculator</h1>
          <p className="text-muted-foreground">Quick calculations</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20">
          <CardContent className="p-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-right">
              <span className="text-3xl font-mono">{display}</span>
            </div>
            <div className="grid gap-2">
              {buttons.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-2">
                  {row.map((btn) => (
                    <Button
                      key={btn}
                      variant={['÷', '×', '-', '+', '='].includes(btn) ? 'default' : 'outline'}
                      className={`h-14 text-lg font-medium ${btn === '0' ? 'col-span-2' : ''} ${
                        ['C', '±', '%'].includes(btn) ? 'bg-muted hover:bg-muted/80' : ''
                      }`}
                      onClick={() => handleButton(btn)}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default MathTool;
