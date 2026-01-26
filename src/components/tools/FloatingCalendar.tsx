import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';

const FloatingCalendar = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col items-center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-md border p-0"
      />
      {date && (
        <p className="text-sm text-muted-foreground mt-2">
          Selected: {date.toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default FloatingCalendar;
