import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, ChevronLeft, TrendingUp, Users, UserCheck, UserX, Trash2, CalendarClock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday } from 'date-fns';

const STORAGE_KEY = 'attendance-quick-entry-draft';

const CLASSES = [
  { id: 'ece', name: 'ECE', fullName: 'Early Childhood Education' },
  { id: 'nursery', name: 'Nursery', fullName: 'Nursery' },
  { id: 'kg', name: 'KG', fullName: 'Kindergarten' },
  { id: 'class-1', name: 'I', fullName: 'Class 1' },
  { id: 'class-2', name: 'II', fullName: 'Class 2' },
  { id: 'class-3', name: 'III', fullName: 'Class 3' },
  { id: 'class-4', name: 'IV', fullName: 'Class 4' },
  { id: 'class-5', name: 'V', fullName: 'Class 5' },
  { id: 'class-6', name: 'VI', fullName: 'Class 6' },
  { id: 'class-7', name: 'VII', fullName: 'Class 7' },
  { id: 'class-8', name: 'VIII', fullName: 'Class 8' },
  { id: 'class-9', name: 'IX', fullName: 'Class 9' },
  { id: 'class-10', name: 'X', fullName: 'Class 10' },
  { id: 'class-11', name: 'XI', fullName: 'Class 11' },
  { id: 'class-12', name: 'XII', fullName: 'Class 12' },
];

const emptyAttendance = () =>
  CLASSES.reduce((acc, cls) => ({
    ...acc,
    [cls.id]: { total: 0, present: 0, absent: 0, percentage: 0 },
  }), {} as Record<string, { total: number; present: number; absent: number; percentage: number }>);

const QuickManualEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState(emptyAttendance());
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  const isPastDate = !isToday(parseISO(date));
  const formattedDate = format(parseISO(date), 'EEEE, MMM d, yyyy');

  // Fetch existing attendance for the selected date
  const fetchExistingAttendance = useCallback(async (selectedDate: string) => {
    if (!user) return;
    setFetching(true);
    try {
      const { data: existing, error } = await supabase
        .from('class_attendance_summary' as any)
        .select('*')
        .eq('attendance_date', selectedDate)
        .eq('user_id', user.id);

      if (error) throw error;

      if (existing && (existing as any[]).length > 0) {
        const restored = emptyAttendance();
        (existing as any[]).forEach((row: any) => {
          if (restored[row.class_id]) {
            restored[row.class_id] = {
              total: row.total_students || 0,
              present: row.present_students || 0,
              absent: row.absent_students || 0,
              percentage: row.attendance_percentage || 0,
            };
          }
        });
        setAttendance(restored);
        setHasExistingData(true);
        toast.info(`Loaded existing attendance for ${format(parseISO(selectedDate), 'MMM d, yyyy')}`);
      } else {
        setAttendance(emptyAttendance());
        setHasExistingData(false);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      toast.error('Failed to fetch existing attendance');
    } finally {
      setFetching(false);
    }
  }, [user]);

  // Restore draft only on first mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date) setDate(parsed.date);
        if (parsed.attendance) setAttendance(parsed.attendance);
        toast.info('Draft restored from previous session');
      }
    } catch { /* ignore */ }
    setDraftLoaded(true);
  }, []);

  // Fetch existing data when date changes (after initial draft load)
  useEffect(() => {
    if (!draftLoaded || !user) return;
    fetchExistingAttendance(date);
  }, [date, draftLoaded, user, fetchExistingAttendance]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!draftLoaded) return;
    const hasData = Object.values(attendance).some(a => a.total > 0);
    if (hasData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, attendance, savedAt: new Date().toISOString() }));
    }
  }, [date, attendance, draftLoaded]);

  const handleClearDraft = () => {
    if (!confirm('Clear all entered data?')) return;
    setAttendance(emptyAttendance());
    setHasExistingData(false);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Draft cleared');
  };

  const updateAttendance = (classId: string, field: 'total' | 'present', value: number) => {
    setAttendance(prev => {
      const current = prev[classId];
      const updated = { ...current, [field]: Math.max(0, value) };
      if (field === 'present') {
        updated.present = Math.min(updated.present, updated.total);
      }
      updated.absent = Math.max(0, updated.total - updated.present);
      updated.percentage = updated.total > 0
        ? Math.round((updated.present / updated.total) * 100)
        : 0;
      return { ...prev, [classId]: updated };
    });
  };

  const handleSubmit = async () => {
    const hasData = Object.values(attendance).some(a => a.total > 0);
    if (!hasData) {
      toast.error('Please enter attendance for at least one class');
      return;
    }
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setSubmitting(true);
    try {
      const records = CLASSES
        .filter(cls => attendance[cls.id].total > 0)
        .map(cls => {
          const data = attendance[cls.id];
          return {
            class_name: cls.fullName,
            class_id: cls.id,
            total_students: data.total,
            present_students: data.present,
            absent_students: data.absent,
            attendance_percentage: data.percentage,
            attendance_date: date,
            user_id: user.id,
          };
        });

      const { error } = await supabase
        .from('class_attendance_summary' as any)
        .upsert(records as any, { onConflict: 'class_id,attendance_date' });

      if (error) throw error;

      localStorage.removeItem(STORAGE_KEY);

      const action = hasExistingData ? 'updated' : 'saved';
      toast.success(`Attendance ${action} for ${records.length} classes on ${format(parseISO(date), 'MMM d, yyyy')}`);
      navigate(`/tools/hr/analytics?date=${date}`);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const totalStudents = Object.values(attendance).reduce((sum, a) => sum + a.total, 0);
  const totalPresent = Object.values(attendance).reduce((sum, a) => sum + a.present, 0);
  const totalAbsent = totalStudents - totalPresent;
  const overallPercentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  const getPercentageColor = (pct: number) => {
    if (pct >= 75) return 'text-green-600 dark:text-green-400';
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = (pct: number) => {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Quick Manual Entry</h1>
              <p className="text-sm text-muted-foreground">Enter attendance for all classes at once</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearDraft} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
            <div>
              <Label htmlFor="att-date" className="text-xs text-muted-foreground">Date</Label>
              <Input
                id="att-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-40"
              />
            </div>
          </div>
        </motion.div>

        {/* Past Date Notice */}
        {isPastDate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
              <CalendarClock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                Editing attendance for {formattedDate}
              </span>
              {hasExistingData && (
                <Badge variant="outline" className="ml-auto border-amber-400 text-amber-700 dark:text-amber-300 text-xs">
                  Existing data loaded — changes will overwrite
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Loading indicator when fetching */}
        {fetching && (
          <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading attendance data...</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: totalStudents, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Present', value: totalPresent, icon: UserCheck, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
            { label: 'Absent', value: totalAbsent, icon: UserX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
            { label: 'Overall %', value: `${overallPercentage}%`, icon: TrendingUp, color: getPercentageColor(overallPercentage), bg: 'bg-purple-50 dark:bg-purple-950/30' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={stat.bg}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Class</th>
                  <th className="text-center px-4 py-3 font-semibold">Total Students</th>
                  <th className="text-center px-4 py-3 font-semibold">Present</th>
                  <th className="text-center px-4 py-3 font-semibold">Absent</th>
                  <th className="text-center px-4 py-3 font-semibold w-48">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {CLASSES.map((cls, idx) => {
                  const data = attendance[cls.id];
                  return (
                    <motion.tr
                      key={cls.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-t border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">{cls.fullName}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Input
                          type="number"
                          min={0}
                          value={data.total || ''}
                          onChange={e => updateAttendance(cls.id, 'total', parseInt(e.target.value) || 0)}
                          className="w-20 mx-auto text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Input
                          type="number"
                          min={0}
                          max={data.total}
                          value={data.present || ''}
                          onChange={e => updateAttendance(cls.id, 'present', parseInt(e.target.value) || 0)}
                          className="w-20 mx-auto text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-muted-foreground">{data.absent}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', getBarColor(data.percentage))}
                              style={{ width: `${data.percentage}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-semibold w-10 text-right', getPercentageColor(data.percentage))}>
                            {data.percentage}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {CLASSES.map((cls) => {
            const data = attendance[cls.id];
            return (
              <Card key={cls.id} className="p-3 space-y-2">
                <p className="font-semibold text-sm">{cls.fullName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total</Label>
                    <Input
                      type="number"
                      min={0}
                      value={data.total || ''}
                      onChange={e => updateAttendance(cls.id, 'total', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Present</Label>
                    <Input
                      type="number"
                      min={0}
                      max={data.total}
                      value={data.present || ''}
                      onChange={e => updateAttendance(cls.id, 'present', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Absent: <strong>{data.absent}</strong></span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', getBarColor(data.percentage))} style={{ width: `${data.percentage}%` }} />
                    </div>
                    <span className={cn('font-semibold', getPercentageColor(data.percentage))}>{data.percentage}%</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end sticky bottom-4">
          <Button variant="outline" onClick={() => navigate('/tools/hr')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || fetching} className="min-w-[160px]">
            {submitting ? (
              <><span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> {hasExistingData ? 'Update Attendance' : 'Submit Attendance'}</>
            )}
          </Button>
        </div>
      </div>
    </Header>
  );
};

export default QuickManualEntry;
