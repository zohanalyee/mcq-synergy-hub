import { Calendar } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useState } from 'react';

const CalendarTool = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Header>
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 mb-4">
            <Calendar className="h-8 w-8 text-sky-500" />
          </div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Plan your study schedule</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">Select a Date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default CalendarTool;
