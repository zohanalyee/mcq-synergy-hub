import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, BarChart3, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStudents, getStudentAttendance, getClasses, getSections } from '@/services/attendanceService';
import type { Class, Section, AttStudent, StudentAttendance } from '@/types/attendance.types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ReportsPage = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<AttStudent[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [report, setReport] = useState<Array<{ name: string; present: number; absent: number; late: number; total: number; pct: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getClasses().then(setClasses); }, []);
  useEffect(() => { if (selectedClass) getSections(selectedClass).then(setSections); }, [selectedClass]);

  const generateReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const attService = await import('@/services/attendanceService');
      const { students: studs } = await attService.getClassAttendanceForDate(selectedClass, selectedSection || '', fromDate);
      // Get attendance for all students in the date range
      const reportData = await Promise.all(studs.map(async (s: AttStudent) => {
        const att = await getStudentAttendance(s.id, fromDate, toDate);
        const present = att.filter(a => a.status === 'Present').length;
        const absent = att.filter(a => a.status === 'Absent').length;
        const late = att.filter(a => a.status === 'Late').length;
        const total = att.length;
        const pct = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;
        return { name: s.full_name, present, absent, late, total, pct };
      }));
      setReport(reportData.sort((a, b) => b.pct - a.pct));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const avgPct = report.length > 0 ? Math.round(report.reduce((s, r) => s + r.pct, 0) / report.length) : 0;
  const defaulters = report.filter(r => r.pct < 75);

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600" /> Reports & Analytics
          </h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedSection || '__all__'} onValueChange={v => setSelectedSection(v === '__all__' ? '' : v)}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Section (All)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sections</SelectItem>
                {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9" />
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9" />
            <Button onClick={generateReport} disabled={!selectedClass || loading} className="h-9">
              {loading ? 'Loading...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        {report.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{report.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Avg Attendance</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{avgPct}%</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Defaulters (&lt;75%)</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{defaulters.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">100% Attendance</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{report.filter(r => r.pct === 100).length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bar Chart */}
            <Card>
              <CardHeader><CardTitle className="text-base">Attendance Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.slice(0, 20)} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="pct" fill="hsl(var(--primary))" name="Attendance %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Defaulters */}
            {defaulters.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader><CardTitle className="text-base text-red-600 dark:text-red-400">⚠ Defaulters (Below 75%)</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {defaulters.map(r => (
                    <div key={r.name} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <span className="text-sm font-medium">{r.name}</span>
                      <Badge variant="outline" className="text-red-600 border-red-300">{r.pct}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Full Report Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Detailed Report</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Student</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-green-600">Present</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-red-600">Absent</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-yellow-600">Late</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Total</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-primary">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={r.name} className={cn('border-b border-border/50', i % 2 === 0 ? 'bg-muted/20' : '')}>
                        <td className="py-2 px-3 font-medium">{r.name}</td>
                        <td className="py-2 px-3 text-center text-green-600">{r.present}</td>
                        <td className="py-2 px-3 text-center text-red-600">{r.absent}</td>
                        <td className="py-2 px-3 text-center text-yellow-600">{r.late}</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">{r.total}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={cn('font-bold', r.pct >= 90 ? 'text-green-600' : r.pct >= 75 ? 'text-amber-600' : 'text-red-600')}>{r.pct}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-bold">
                      <td className="py-2 px-3">Average</td>
                      <td className="py-2 px-3 text-center text-green-600">{Math.round(report.reduce((s, r) => s + r.present, 0) / report.length)}</td>
                      <td className="py-2 px-3 text-center text-red-600">{Math.round(report.reduce((s, r) => s + r.absent, 0) / report.length)}</td>
                      <td className="py-2 px-3 text-center text-yellow-600">{Math.round(report.reduce((s, r) => s + r.late, 0) / report.length)}</td>
                      <td className="py-2 px-3 text-center"></td>
                      <td className="py-2 px-3 text-center text-primary">{avgPct}%</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </>
        )}

        {report.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Select a class and generate a report to see analytics.</p>
          </div>
        )}
      </div>
    </Header>
  );
};

export default ReportsPage;
