import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const CalendarTool = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <Header>
      <ToolWrapper
        toolId="calendar"
        title="Calendar"
        description="Plan your study schedule with a clean monthly calendar"
        category="Productivity"
      >
        <div className="flex flex-col items-center gap-3">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
          {date && (
            <p className="text-sm text-muted-foreground">
              Selected: <span className="text-foreground font-medium">{date.toLocaleDateString()}</span>
            </p>
          )}
        </div>
      </ToolWrapper>
    </Header>
  );
};

export default CalendarTool;
