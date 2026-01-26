import { Cake } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

const AgeCalculator = () => {
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
    <Header>
      <div className="container py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 mb-4">
            <Cake className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-bold">Age Calculator</h1>
          <p className="text-muted-foreground">Calculate your exact age</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">Enter Your Birth Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="birthdate">Birth Date</Label>
              <Input
                id="birthdate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-background"
              />
            </div>
            
            <Button onClick={calculateAge} className="w-full">
              Calculate Age
            </Button>
            
            {age && (
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-4 rounded-lg bg-rose-500/10">
                  <div className="text-3xl font-bold text-rose-500">{age.years}</div>
                  <div className="text-sm text-muted-foreground">Years</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-rose-500/10">
                  <div className="text-3xl font-bold text-rose-500">{age.months}</div>
                  <div className="text-sm text-muted-foreground">Months</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-rose-500/10">
                  <div className="text-3xl font-bold text-rose-500">{age.days}</div>
                  <div className="text-sm text-muted-foreground">Days</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default AgeCalculator;
