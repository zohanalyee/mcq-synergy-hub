import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ChevronLeft, Save, Users, CheckCircle2, XCircle, Clock, 
  CalendarDays, Search, CheckSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getClasses, getSections, getClassAttendanceForDate, saveStudentAttendance } from '@/services/attendanceService';
import type { Class, Section, AttStudent, StudentAttendance, AttendanceStatus } from '@/types/attendance.types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half-day', 'Leave', 'Holiday'];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  Present: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  Absent: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
  Late: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  'Half-day': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Leave: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  Holiday: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600',
};

const StudentAttendancePage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<AttStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) getSections(selectedClass).then(setSections).catch(console.error);
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection && selectedDate) loadAttendance();
  }, [selectedClass, selectedSection, selectedDate]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const { students: studs, attendance: att } = await getClassAttendanceForDate(selectedClass, selectedSection, selectedDate);
      setStudents(studs);
      const map: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      studs.forEach(s => {
        map[s.id] = att[s.id]
          ? { status: att[s.id].status, remarks: att[s.id].remarks || '' }
          : { status: 'Present', remarks: '' };
      });
      setAttendance(map);
    } catch (e) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance(prev => {
      const next = { ...prev };
      students.forEach(s => { next[s.id] = { ...next[s.id], status }; });
      return next;
    });
  };

  const markOne = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  };

  const setRemarks = (studentId: string, remarks: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: { ...prev[studentId], remarks } }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        date: selectedDate,
        status: attendance[s.id]?.status || 'Present',
        remarks: attendance[s.id]?.remarks || '',
        marked_by: user?.id,
      }));
      await saveStudentAttendance(records as any);
      toast.success(`Attendance saved for ${students.length} students!`);
    } catch (e) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()));
  
  const summary = students.reduce((acc, s) => {
    const st = attendance[s.id]?.status || 'Present';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Back + Title */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" /> Student Attendance
            </h1>
            <p className="text-xs text-muted-foreground">Mark daily attendance for your classes</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date</label>
              <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-9" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Class</label>
              <Select value={selectedClass} onValueChange={v => { setSelectedClass(v); setSelectedSection(''); }}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  <SelectItem value="__unassigned__" className="text-orange-600 dark:text-orange-400">⚠ Unassigned Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass || selectedClass === '__unassigned__'}>
                <SelectTrigger className="h-9"><SelectValue placeholder={
                  selectedClass === '__unassigned__' ? "N/A for unassigned" :
                  !selectedClass ? "Select class first" : sections.length === 0 ? "No sections found" : "Select section"
                } /></SelectTrigger>
                <SelectContent>
                  {sections.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No sections added for this class. Go to <span className="font-medium">Setup → Classes</span> to add sections.</div>
                  ) : (
                    sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" className="w-full h-9" onClick={loadAttendance} disabled={!selectedClass || !selectedSection}>
                Load Students
              </Button>
            </div>
          </CardContent>
        </Card>

        {students.length > 0 && (
          <>
            {/* Summary + Bulk Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(summary).map(([status, count]) => (
                <Badge key={status} variant="outline" className={cn('text-xs', STATUS_STYLE[status as AttendanceStatus])}>
                  {status}: {count}
                </Badge>
              ))}
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => markAll('Present')} className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950/30">
                  <CheckSquare className="h-3.5 w-3.5 mr-1" /> All Present
                </Button>
                <Button size="sm" variant="outline" onClick={() => markAll('Absent')} className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30">
                  <XCircle className="h-3.5 w-3.5 mr-1" /> All Absent
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
            </div>

            {/* Student List */}
            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading students...</div>
              ) : filtered.map((student, i) => (
                <motion.div key={student.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className={cn('border transition-colors', attendance[student.id]?.status && STATUS_STYLE[attendance[student.id].status])}>
                    <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {student.roll_number || (i + 1)}
                        </div>
                        <p className="font-medium text-sm text-foreground truncate">{student.full_name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => markOne(student.id, s)}
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all',
                              attendance[student.id]?.status === s
                                ? STATUS_STYLE[s]
                                : 'border-border text-muted-foreground hover:border-primary/50'
                            )}
                          >
                            {s === 'Half-day' ? 'HD' : s.charAt(0)}
                            <span className="hidden sm:inline ml-0.5">{s === 'Half-day' ? '' : s.slice(1)}</span>
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Remarks..."
                        value={attendance[student.id]?.remarks || ''}
                        onChange={e => setRemarks(student.id, e.target.value)}
                        className="h-7 text-xs w-full sm:w-32"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Save */}
            <div className="sticky bottom-4">
              <Button onClick={saveAll} disabled={saving} className="w-full sm:w-auto shadow-lg" size="lg">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : `Save Attendance (${students.length} students)`}
              </Button>
            </div>
          </>
        )}

        {students.length === 0 && !loading && selectedClass && selectedSection && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No students found. Add students in <Link to="/tools/hr/setup" className="text-primary underline">Setup</Link>.</p>
          </div>
        )}

        {!selectedClass && (
          <div className="text-center py-12 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Select a class and section to begin marking attendance.</p>
            {classes.length === 0 && <p className="mt-2 text-sm">No classes yet. <Link to="/tools/hr/setup" className="text-primary underline">Add classes first</Link>.</p>}
          </div>
        )}
      </div>
    </Header>
  );
};

export default StudentAttendancePage;
