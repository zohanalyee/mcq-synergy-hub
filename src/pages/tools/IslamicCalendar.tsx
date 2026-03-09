import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Moon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToolWrapper from '@/components/tools/ToolWrapper';

const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ISLAMIC_EVENTS: Record<string, { name: string; color: string }> = {
  '1-1': { name: 'Islamic New Year', color: 'bg-emerald-500' },
  '1-10': { name: 'Day of Ashura', color: 'bg-red-500' },
  '3-12': { name: 'Mawlid al-Nabi ﷺ', color: 'bg-green-600' },
  '7-27': { name: 'Isra & Miraj', color: 'bg-blue-500' },
  '8-15': { name: 'Shab-e-Barat', color: 'bg-purple-500' },
  '9-1': { name: 'Start of Ramadan', color: 'bg-amber-500' },
  '9-27': { name: 'Laylat al-Qadr', color: 'bg-yellow-500' },
  '10-1': { name: 'Eid al-Fitr', color: 'bg-emerald-600' },
  '10-2': { name: 'Eid al-Fitr (Day 2)', color: 'bg-emerald-600' },
  '10-3': { name: 'Eid al-Fitr (Day 3)', color: 'bg-emerald-600' },
  '12-8': { name: 'Start of Hajj', color: 'bg-amber-600' },
  '12-9': { name: 'Day of Arafah', color: 'bg-amber-700' },
  '12-10': { name: 'Eid al-Adha', color: 'bg-emerald-700' },
  '12-11': { name: 'Eid al-Adha (Day 2)', color: 'bg-emerald-700' },
  '12-12': { name: 'Eid al-Adha (Day 3)', color: 'bg-emerald-700' },
};

// Approximate Hijri date calculation using the Tabular Islamic Calendar
function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  const gd = date.getDate();
  const gm = date.getMonth() + 1;
  const gy = date.getFullYear();

  let jd: number;
  if (gm > 2) {
    jd = Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (gm + 1)) + gd - 1524.5;
  } else {
    jd = Math.floor(365.25 * (gy + 4715)) + Math.floor(30.6001 * (gm + 13)) + gd - 1524.5;
  }

  const l = Math.floor(jd) - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
          + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
           - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  return { year: hy, month: hm, day: hd };
}

function hijriToGregorian(hy: number, hm: number, hd: number): Date {
  const jd = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm
           - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
  
  const l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gd = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gm = j + 2 - 12 * l4;
  const gy = 100 * (n - 49) + i + l4;
  
  return new Date(gy, gm - 1, gd);
}

function getHijriMonthDays(year: number, month: number): number {
  // Tabular: odd months have 30, even have 29, except month 12 in leap years has 30
  const isLeapYear = (14 + 11 * year) % 30 < 11;
  if (month % 2 === 1) return 30;
  if (month === 12 && isLeapYear) return 30;
  return 29;
}

const IslamicCalendar = () => {
  const todayHijri = useMemo(() => gregorianToHijri(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(todayHijri.month);
  const [currentYear, setCurrentYear] = useState(todayHijri.year);

  const daysInMonth = getHijriMonthDays(currentYear, currentMonth);
  
  // Get the Gregorian date for the 1st of this Hijri month to find what weekday it starts
  const firstDayGreg = hijriToGregorian(currentYear, currentMonth, 1);
  const startWeekday = firstDayGreg.getDay();

  const navigate = (dir: -1 | 1) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const goToToday = () => {
    setCurrentMonth(todayHijri.month);
    setCurrentYear(todayHijri.year);
  };

  const eventsThisMonth = Object.entries(ISLAMIC_EVENTS)
    .filter(([key]) => {
      const [m] = key.split('-').map(Number);
      return m === currentMonth;
    })
    .map(([key, val]) => ({ day: parseInt(key.split('-')[1]), ...val }));

  const todayGreg = new Date();
  const todayStr = `${todayGreg.getFullYear()}-${todayGreg.getMonth()}-${todayGreg.getDate()}`;

  return (
    <ToolWrapper
      toolId="islamic-calendar"
      title="Islamic (Hijri) Calendar"
      description="View Hijri dates, important Islamic events, and convert to Gregorian"
    >
      <div className="space-y-4">
        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{HIJRI_MONTHS[currentMonth - 1]} {currentYear} AH</h2>
                <p className="text-xs text-muted-foreground">
                  ≈ {firstDayGreg.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full mb-4" onClick={goToToday}>
              <Moon className="h-4 w-4 mr-1" /> Today: {todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year}
            </Button>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const eventKey = `${currentMonth}-${day}`;
                const event = ISLAMIC_EVENTS[eventKey];
                const isToday = currentMonth === todayHijri.month && currentYear === todayHijri.year && day === todayHijri.day;
                const gregDate = hijriToGregorian(currentYear, currentMonth, day);
                const isFriday = gregDate.getDay() === 5;

                return (
                  <div
                    key={day}
                    className={cn(
                      "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors cursor-default",
                      isToday && "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30",
                      !isToday && event && "bg-accent/80",
                      !isToday && !event && isFriday && "bg-muted/60",
                      !isToday && !event && !isFriday && "hover:bg-muted/40"
                    )}
                    title={event ? `${event.name}\n${gregDate.toLocaleDateString()}` : gregDate.toLocaleDateString()}
                  >
                    <span className="font-medium">{day}</span>
                    <span className="text-[9px] text-muted-foreground leading-none">{gregDate.getDate()}</span>
                    {event && <div className={cn("absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full", event.color)} />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events this month */}
        {eventsThisMonth.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Events in {HIJRI_MONTHS[currentMonth - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eventsThisMonth.map(ev => (
                <div key={ev.day} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="min-w-[28px] justify-center">{ev.day}</Badge>
                  <div className={cn("w-2 h-2 rounded-full", ev.color)} />
                  <span>{ev.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
            <p>📌 This uses the Tabular Islamic Calendar algorithm. Actual dates may vary by ±1–2 days depending on moon sighting in your region.</p>
            <p>📌 Small numbers under each date show the corresponding Gregorian date.</p>
          </CardContent>
        </Card>
      </div>
    </ToolWrapper>
  );
};

export default IslamicCalendar;
