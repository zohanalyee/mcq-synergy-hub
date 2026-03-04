import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';

const ZONES = [
  { name: 'Local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
  { name: 'New York', tz: 'America/New_York' },
  { name: 'London', tz: 'Europe/London' },
  { name: 'Dubai', tz: 'Asia/Dubai' },
  { name: 'Karachi', tz: 'Asia/Karachi' },
  { name: 'Mumbai', tz: 'Asia/Kolkata' },
  { name: 'Tokyo', tz: 'Asia/Tokyo' },
  { name: 'Sydney', tz: 'Australia/Sydney' },
  { name: 'Los Angeles', tz: 'America/Los_Angeles' },
];

const WorldClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);

  return (
    <Header>
      <ToolWrapper toolId="world-clock" title="World Clock" description="View current time across timezones" category="Productivity">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ZONES.map(zone => (
            <div key={zone.tz} className="p-4 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors">
              <p className="text-sm text-muted-foreground">{zone.name}</p>
              <p className="text-2xl font-mono font-bold text-foreground">
                {now.toLocaleTimeString('en-US', { timeZone: zone.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-muted-foreground">{now.toLocaleDateString('en-US', { timeZone: zone.tz, weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
          ))}
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default WorldClock;
