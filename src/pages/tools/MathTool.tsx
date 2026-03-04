import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
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

  const handleButton = (btn: string) => {
    if (btn >= '0' && btn <= '9') inputDigit(btn);
    else if (btn === '.') inputDecimal();
    else if (btn === 'C') clear();
    else if (btn === '=') handleEquals();
    else if (['+', '-', '×', '÷'].includes(btn)) performOperation(btn);
    else if (btn === '±') setDisplay(String(-parseFloat(display)));
    else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
  };

  const isOperator = (btn: string) => ['+', '-', '×', '÷'].includes(btn);
  const isActiveOp = (btn: string) => operation === btn && waitingForOperand;

  return (
    <Header>
      <ToolWrapper toolId="calculator" title="Calculator" description="Basic & scientific calculator" category="Calculators">
        <div className="max-w-sm mx-auto">
          {/* Display */}
          <div className="bg-muted/50 rounded-xl p-4 mb-4 text-right">
            <div className="text-xs text-muted-foreground h-5">
              {previousValue !== null && `${previousValue} ${operation || ''}`}
            </div>
            <span className="text-4xl font-mono font-bold text-foreground">{display}</span>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1: C ± % ÷ */}
            {['C', '±', '%'].map(btn => (
              <Button key={btn} variant="secondary" className="h-14 text-lg font-medium" onClick={() => handleButton(btn)}>
                {btn}
              </Button>
            ))}
            <Button
              className={`h-14 text-lg font-bold ${isActiveOp('÷') ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              onClick={() => handleButton('÷')}
            >
              ÷
            </Button>

            {/* Row 2: 7 8 9 × */}
            {['7', '8', '9'].map(d => (
              <Button key={d} variant="outline" className="h-14 text-lg font-medium" onClick={() => handleButton(d)}>{d}</Button>
            ))}
            <Button
              className={`h-14 text-lg font-bold ${isActiveOp('×') ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              onClick={() => handleButton('×')}
            >
              ×
            </Button>

            {/* Row 3: 4 5 6 - */}
            {['4', '5', '6'].map(d => (
              <Button key={d} variant="outline" className="h-14 text-lg font-medium" onClick={() => handleButton(d)}>{d}</Button>
            ))}
            <Button
              className={`h-14 text-lg font-bold ${isActiveOp('-') ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              onClick={() => handleButton('-')}
            >
              −
            </Button>

            {/* Row 4: 1 2 3 + */}
            {['1', '2', '3'].map(d => (
              <Button key={d} variant="outline" className="h-14 text-lg font-medium" onClick={() => handleButton(d)}>{d}</Button>
            ))}
            <Button
              className={`h-14 text-lg font-bold ${isActiveOp('+') ? 'bg-primary text-primary-foreground ring-2 ring-primary/50' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              onClick={() => handleButton('+')}
            >
              +
            </Button>

            {/* Row 5: 0 . = */}
            <Button variant="outline" className="h-14 text-lg font-medium col-span-2" onClick={() => handleButton('0')}>0</Button>
            <Button variant="outline" className="h-14 text-lg font-medium" onClick={() => handleButton('.')}>.</Button>
            <Button
              className="h-14 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleButton('=')}
            >
              =
            </Button>
          </div>
        </div>
      </ToolWrapper>
    </Header>
  );
};

export default MathTool;
