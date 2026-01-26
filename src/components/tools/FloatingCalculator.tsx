import { useState } from 'react';
import { Button } from '@/components/ui/button';

const FloatingCalculator = () => {
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
      const currentValue = previousValue || 0;
      let newValue = currentValue;
      
      switch (operation) {
        case '+': newValue = currentValue + inputValue; break;
        case '-': newValue = currentValue - inputValue; break;
        case '×': newValue = currentValue * inputValue; break;
        case '÷': newValue = inputValue !== 0 ? currentValue / inputValue : 0; break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;
    
    const inputValue = parseFloat(display);
    let result = previousValue;

    switch (operation) {
      case '+': result = previousValue + inputValue; break;
      case '-': result = previousValue - inputValue; break;
      case '×': result = previousValue * inputValue; break;
      case '÷': result = inputValue !== 0 ? previousValue / inputValue : 0; break;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const buttonClass = "h-10 text-base font-medium";

  return (
    <div className="space-y-2">
      <div className="bg-muted/50 rounded-lg p-3 text-right">
        <div className="text-2xl font-mono truncate">{display}</div>
      </div>
      
      <div className="grid grid-cols-4 gap-1.5">
        <Button variant="secondary" className={buttonClass} onClick={clear}>C</Button>
        <Button variant="secondary" className={buttonClass} onClick={() => setDisplay(String(-parseFloat(display)))}>±</Button>
        <Button variant="secondary" className={buttonClass} onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</Button>
        <Button variant="outline" className={`${buttonClass} text-primary`} onClick={() => performOperation('÷')}>÷</Button>

        {['7', '8', '9'].map(d => (
          <Button key={d} variant="ghost" className={buttonClass} onClick={() => inputDigit(d)}>{d}</Button>
        ))}
        <Button variant="outline" className={`${buttonClass} text-primary`} onClick={() => performOperation('×')}>×</Button>

        {['4', '5', '6'].map(d => (
          <Button key={d} variant="ghost" className={buttonClass} onClick={() => inputDigit(d)}>{d}</Button>
        ))}
        <Button variant="outline" className={`${buttonClass} text-primary`} onClick={() => performOperation('-')}>−</Button>

        {['1', '2', '3'].map(d => (
          <Button key={d} variant="ghost" className={buttonClass} onClick={() => inputDigit(d)}>{d}</Button>
        ))}
        <Button variant="outline" className={`${buttonClass} text-primary`} onClick={() => performOperation('+')}>+</Button>

        <Button variant="ghost" className={`${buttonClass} col-span-2`} onClick={() => inputDigit('0')}>0</Button>
        <Button variant="ghost" className={buttonClass} onClick={inputDecimal}>.</Button>
        <Button className={buttonClass} onClick={calculate}>=</Button>
      </div>
    </div>
  );
};

export default FloatingCalculator;
