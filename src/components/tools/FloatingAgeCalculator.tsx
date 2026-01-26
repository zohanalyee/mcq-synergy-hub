import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const FloatingAgeCalculator = () => {
  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState<{ years: number; months: number; days: number } | null>(null);

  const calculateAge = () => {
    if (!birthDate) return;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    setAge({ years, months, days });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="birthdate">Date of Birth</Label>
        <Input
          id="birthdate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="text-sm"
        />
      </div>
      
      <Button onClick={calculateAge} className="w-full" size="sm">
        Calculate Age
      </Button>
      
      {age && (
        <div className="bg-muted/50 rounded-lg p-3 text-center space-y-1">
          <p className="text-xs text-muted-foreground">Your age is</p>
          <div className="flex justify-center gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{age.years}</p>
              <p className="text-xs text-muted-foreground">Years</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{age.months}</p>
              <p className="text-xs text-muted-foreground">Months</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{age.days}</p>
              <p className="text-xs text-muted-foreground">Days</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingAgeCalculator;
