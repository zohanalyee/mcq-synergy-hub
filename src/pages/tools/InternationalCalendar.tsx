import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Globe, Star, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToolWrapper from '@/components/tools/ToolWrapper';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarLocale {
  id: string;
  name: string;
  calendar: string;
  locale: string;
}

const CALENDAR_SYSTEMS: CalendarLocale[] = [
  { id: 'gregorian', name: 'Gregorian (International)', calendar: 'gregory', locale: 'en-US' },
  { id: 'islamic', name: 'Islamic (Hijri)', calendar: 'islamic-umalqura', locale: 'ar-SA' },
  { id: 'persian', name: 'Persian (Solar Hijri)', calendar: 'persian', locale: 'fa-IR' },
  { id: 'chinese', name: 'Chinese', calendar: 'chinese', locale: 'zh-CN' },
  { id: 'hebrew', name: 'Hebrew (Jewish)', calendar: 'hebrew', locale: 'he-IL' },
  { id: 'indian', name: 'Indian (Saka)', calendar: 'indian', locale: 'en-IN' },
  { id: 'japanese', name: 'Japanese (Imperial)', calendar: 'japanese', locale: 'ja-JP' },
  { id: 'buddhist', name: 'Buddhist (Thai)', calendar: 'buddhist', locale: 'th-TH' },
  { id: 'ethiopic', name: 'Ethiopian', calendar: 'ethiopic', locale: 'am-ET' },
  { id: 'coptic', name: 'Coptic', calendar: 'coptic', locale: 'en-US' },
];

const INTERNATIONAL_DAYS: Record<string, { name: string; emoji: string }> = {
  '1-1': { name: "New Year's Day", emoji: '🎆' },
  '1-26': { name: 'Republic Day (India)', emoji: '🇮🇳' },
  '2-14': { name: "Valentine's Day", emoji: '❤️' },
  '3-8': { name: "International Women's Day", emoji: '👩' },
  '3-21': { name: 'Nowruz / Spring Equinox', emoji: '🌸' },
  '3-23': { name: 'Pakistan Day', emoji: '🇵🇰' },
  '4-22': { name: 'Earth Day', emoji: '🌍' },
  '5-1': { name: 'International Workers Day', emoji: '👷' },
  '6-5': { name: 'World Environment Day', emoji: '🌱' },
  '6-21': { name: 'Summer Solstice', emoji: '☀️' },
  '8-14': { name: 'Pakistan Independence Day', emoji: '🇵🇰' },
  '8-15': { name: 'India Independence Day', emoji: '🇮🇳' },
  '9-21': { name: 'International Day of Peace', emoji: '🕊️' },
  '10-24': { name: 'United Nations Day', emoji: '🇺🇳' },
  '10-31': { name: 'Halloween', emoji: '🎃' },
  '11-20': { name: 'Universal Children\'s Day', emoji: '👶' },
  '12-10': { name: 'Human Rights Day', emoji: '✊' },
  '12-25': { name: 'Christmas', emoji: '🎄' },
  '12-31': { name: "New Year's Eve", emoji: '🎊' },
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatInCalendar(date: Date, calendarSystem: CalendarLocale): string {
  try {
    return new Intl.DateTimeFormat(calendarSystem.locale, {
      calendar: calendarSystem.calendar,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

const InternationalCalendar = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedCalendar, setSelectedCalendar] = useState<string>('gregorian');
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const calSystem = CALENDAR_SYSTEMS.find(c => c.id === selectedCalendar) || CALENDAR_SYSTEMS[0];
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startWeekday = getFirstDayOfWeek(currentYear, currentMonth);

  const navigate = (dir: -1 | 1) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };

  const eventsThisMonth = Object.entries(INTERNATIONAL_DAYS)
    .filter(([key]) => {
      const [m] = key.split('-').map(Number);
      return m === currentMonth + 1;
    })
    .map(([key, val]) => ({ day: parseInt(key.split('-')[1]), ...val }));

  return (
    <ToolWrapper
      toolId="international-calendar"
      title="International Calendar"
      description="View dates in 10+ calendar systems — Gregorian, Hijri, Persian, Chinese, Hebrew & more"
    >
      <div className="space-y-4">
        {/* Calendar system selector */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Calendar System</label>
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALENDAR_SYSTEMS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Converted date display */}
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Selected date in {calSystem.name}</p>
              <p className="text-lg font-bold text-foreground">{formatInCalendar(selectedDate, calSystem)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Gregorian: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Calendar grid */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{MONTHS[currentMonth]} {currentYear}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full mb-4" onClick={goToToday}>
              <CalendarDays className="h-4 w-4 mr-1" /> Go to Today
            </Button>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(currentYear, currentMonth, day);
                const eventKey = `${currentMonth + 1}-${day}`;
                const event = INTERNATIONAL_DAYS[eventKey];
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                      isToday && !isSelected && "bg-primary/20 font-bold",
                      isSelected && "bg-primary text-primary-foreground font-bold ring-2 ring-primary/30",
                      !isToday && !isSelected && event && "bg-accent/80",
                      !isToday && !isSelected && !event && "hover:bg-muted/40"
                    )}
                    title={event ? event.name : undefined}
                  >
                    <span>{day}</span>
                    {event && <span className="text-[10px] leading-none">{event.emoji}</span>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Multi-calendar conversion for selected date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Date in All Calendars
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {CALENDAR_SYSTEMS.map(cal => (
              <div key={cal.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground">{cal.name}</span>
                <span className="font-medium text-foreground">{formatInCalendar(selectedDate, cal)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Events this month */}
        {eventsThisMonth.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" /> Events in {MONTHS[currentMonth]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {eventsThisMonth.map(ev => (
                <div key={ev.day} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline" className="min-w-[28px] justify-center">{ev.day}</Badge>
                  <span>{ev.emoji}</span>
                  <span>{ev.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default InternationalCalendar;
