import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, Plus, CheckCircle2, XCircle, Clock, FileText, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStudents, getStaff, getStudentLeaves, getStaffLeaves, applyStudentLeave, applyStaffLeave, updateStudentLeaveStatus, updateStaffLeaveStatus } from '@/services/attendanceService';
import type { AttStudent, AttStaff, StudentLeave, StaffLeave } from '@/types/attendance.types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  Approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700',
  Rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700',
};

const LeavesPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<AttStudent[]>([]);
  const [staff, setStaff] = useState<AttStaff[]>([]);
  const [studentLeaves, setStudentLeaves] = useState<StudentLeave[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeave[]>([]);
  
  // Student leave form
  const [sLeave, setSLeave] = useState({ student_id: '', leave_type: 'Sick' as any, from_date: '', to_date: '', reason: '', status: 'Pending' as any });
  // Staff leave form
  const [stLeave, setStLeave] = useState({ staff_id: '', leave_type: 'CL' as any, from_date: '', to_date: '', reason: '', total_days: 0, status: 'Pending' as any });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [stu, stf, sl, stfl] = await Promise.all([getStudents(), getStaff(), getStudentLeaves(), getStaffLeaves()]);
      setStudents(stu); setStaff(stf); setStudentLeaves(sl); setStaffLeaves(stfl);
    } catch (e) { console.error(e); }
  };

  const calcDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const d1 = new Date(from), d2 = new Date(to);
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
  };

  const handleApplyStudentLeave = async () => {
    if (!sLeave.student_id || !sLeave.from_date || !sLeave.to_date || !sLeave.reason) return toast.error('Fill all required fields');
    try {
      const total_days = calcDays(sLeave.from_date, sLeave.to_date);
      await applyStudentLeave({ ...sLeave, total_days });
      setSLeave({ student_id: '', leave_type: 'Sick', from_date: '', to_date: '', reason: '', status: 'Pending' });
      toast.success('Leave applied!');
      getStudentLeaves().then(setStudentLeaves);
    } catch { toast.error('Failed to apply leave'); }
  };

  const handleApplyStaffLeave = async () => {
    if (!stLeave.staff_id || !stLeave.from_date || !stLeave.to_date || !stLeave.reason) return toast.error('Fill all required fields');
    try {
      const total_days = calcDays(stLeave.from_date, stLeave.to_date);
      await applyStaffLeave({ ...stLeave, total_days });
      setStLeave({ staff_id: '', leave_type: 'CL', from_date: '', to_date: '', reason: '', total_days: 0, status: 'Pending' });
      toast.success('Leave applied!');
      getStaffLeaves().then(setStaffLeaves);
    } catch { toast.error('Failed to apply leave'); }
  };

  const approveStudentLeave = async (id: string) => {
    try {
      await updateStudentLeaveStatus(id, 'Approved', user?.id || '');
      toast.success('Leave approved');
      getStudentLeaves().then(setStudentLeaves);
    } catch { toast.error('Failed'); }
  };

  const rejectStudentLeave = async (id: string) => {
    try {
      await updateStudentLeaveStatus(id, 'Rejected', user?.id || '', 'Not approved');
      toast.success('Leave rejected');
      getStudentLeaves().then(setStudentLeaves);
    } catch { toast.error('Failed'); }
  };

  const approveStaffLeave = async (id: string) => {
    try {
      await updateStaffLeaveStatus(id, 'Approved', user?.id || '');
      toast.success('Leave approved');
      getStaffLeaves().then(setStaffLeaves);
    } catch { toast.error('Failed'); }
  };

  const rejectStaffLeave = async (id: string) => {
    try {
      await updateStaffLeaveStatus(id, 'Rejected', user?.id || '', 'Not approved');
      toast.success('Leave rejected');
      getStaffLeaves().then(setStaffLeaves);
    } catch { toast.error('Failed'); }
  };

  const getStudentName = (id: string) => students.find(s => s.id === id)?.full_name || 'Unknown';
  const getStaffName = (id: string) => staff.find(s => s.id === id)?.full_name || 'Unknown';

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/school-attendance-system"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" /> Leave Management
          </h1>
        </div>

        <Tabs defaultValue="student-apply">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="student-apply">Apply Student Leave</TabsTrigger>
            <TabsTrigger value="staff-apply">Apply Staff Leave</TabsTrigger>
            <TabsTrigger value="approve">Pending Approvals <Badge variant="destructive" className="ml-1 text-[10px] h-4 px-1">{[...studentLeaves, ...staffLeaves].filter(l => l.status === 'Pending').length}</Badge></TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Student Leave Application */}
          <TabsContent value="student-apply">
            <Card>
              <CardHeader><CardTitle className="text-base">Student Leave Application</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Student *</Label>
                  <Select value={sLeave.student_id} onValueChange={v => setSLeave(p => ({ ...p, student_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={sLeave.leave_type} onValueChange={v => setSLeave(p => ({ ...p, leave_type: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['Sick', 'Casual', 'Medical', 'Other'].map(t => <SelectItem key={t} value={t}>{t} Leave</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>From Date *</Label>
                  <Input type="date" value={sLeave.from_date} onChange={e => setSLeave(p => ({ ...p, from_date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>To Date *</Label>
                  <Input type="date" value={sLeave.to_date} onChange={e => setSLeave(p => ({ ...p, to_date: e.target.value }))} className="mt-1" />
                </div>
                {sLeave.from_date && sLeave.to_date && (
                  <div className="sm:col-span-2 text-sm text-muted-foreground">Total: <strong>{calcDays(sLeave.from_date, sLeave.to_date)} day(s)</strong></div>
                )}
                <div className="sm:col-span-2">
                  <Label>Reason *</Label>
                  <Textarea value={sLeave.reason} onChange={e => setSLeave(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." className="mt-1" rows={3} />
                </div>
                <Button onClick={handleApplyStudentLeave} className="sm:col-span-2">Submit Leave Application</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Leave Application */}
          <TabsContent value="staff-apply">
            <Card>
              <CardHeader><CardTitle className="text-base">Staff Leave Application</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Staff Member *</Label>
                  <Select value={stLeave.staff_id} onValueChange={v => setStLeave(p => ({ ...p, staff_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={stLeave.leave_type} onValueChange={v => setStLeave(p => ({ ...p, leave_type: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[{ v: 'CL', l: 'Casual Leave' }, { v: 'SL', l: 'Sick Leave' }, { v: 'EL', l: 'Earned Leave' }, { v: 'ML', l: 'Maternity Leave' }, { v: 'PL', l: 'Paternity Leave' }, { v: 'Unpaid', l: 'Unpaid Leave' }].map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>From Date *</Label>
                  <Input type="date" value={stLeave.from_date} onChange={e => setStLeave(p => ({ ...p, from_date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>To Date *</Label>
                  <Input type="date" value={stLeave.to_date} onChange={e => setStLeave(p => ({ ...p, to_date: e.target.value }))} className="mt-1" />
                </div>
                {stLeave.from_date && stLeave.to_date && (
                  <div className="sm:col-span-2 text-sm text-muted-foreground">Total: <strong>{calcDays(stLeave.from_date, stLeave.to_date)} day(s)</strong></div>
                )}
                <div className="sm:col-span-2">
                  <Label>Reason *</Label>
                  <Textarea value={stLeave.reason} onChange={e => setStLeave(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave..." className="mt-1" rows={3} />
                </div>
                <Button onClick={handleApplyStaffLeave} className="sm:col-span-2">Submit Leave Application</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals */}
          <TabsContent value="approve" className="space-y-3">
            {[...studentLeaves.filter(l => l.status === 'Pending').map(l => ({ ...l, type: 'student' })),
               ...staffLeaves.filter(l => l.status === 'Pending').map(l => ({ ...l, type: 'staff' }))].length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No pending leave requests!</p>
              </div>
            ) : null}
            {studentLeaves.filter(l => l.status === 'Pending').map(leave => (
              <Card key={leave.id} className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Student</Badge>
                      <Badge variant="outline" className="text-xs">{leave.leave_type}</Badge>
                    </div>
                    <p className="font-semibold text-sm">{getStudentName(leave.student_id)}</p>
                    <p className="text-xs text-muted-foreground">{leave.from_date} → {leave.to_date} · {leave.total_days} day(s)</p>
                    <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => approveStudentLeave(leave.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => rejectStudentLeave(leave.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {staffLeaves.filter(l => l.status === 'Pending').map(leave => (
              <Card key={leave.id} className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">Staff</Badge>
                      <Badge variant="outline" className="text-xs">{leave.leave_type}</Badge>
                    </div>
                    <p className="font-semibold text-sm">{getStaffName(leave.staff_id)}</p>
                    <p className="text-xs text-muted-foreground">{leave.from_date} → {leave.to_date} · {leave.total_days} day(s)</p>
                    <p className="text-xs text-muted-foreground mt-1">{leave.reason}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => approveStaffLeave(leave.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => rejectStaffLeave(leave.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-2">
            {[...studentLeaves, ...staffLeaves]
              .filter(l => l.status !== 'Pending')
              .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
              .map((leave: any) => (
                <Card key={leave.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{leave.student_id ? getStudentName(leave.student_id) : getStaffName(leave.staff_id)}</p>
                      <p className="text-xs text-muted-foreground">{leave.leave_type} · {leave.from_date} → {leave.to_date}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-xs', STATUS_BADGE[leave.status])}>{leave.status}</Badge>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default LeavesPage;
