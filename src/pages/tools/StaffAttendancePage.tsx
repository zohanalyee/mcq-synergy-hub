import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ChevronLeft, Clock, CheckCircle2, Plus, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStaff, getShifts, getStaffAttendanceForDate, checkInStaff, checkOutStaff } from '@/services/attendanceService';
import type { AttStaff, Shift, StaffAttendance } from '@/types/attendance.types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const StaffAttendancePage = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<AttStaff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 8);

  useEffect(() => { loadData(); }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stf, sh, att] = await Promise.all([getStaff(), getShifts(), getStaffAttendanceForDate(selectedDate)]);
      setStaff(stf); setShifts(sh); setAttendance(att);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStaffAtt = (staffId: string) => attendance.find(a => a.staff_id === staffId);

  const getStatus = (staffId: string): string => {
    const att = getStaffAtt(staffId);
    if (!att) return 'Not Checked In';
    if (att.check_in_time && att.check_out_time) return 'Checked Out';
    if (att.check_in_time) return 'Checked In';
    return att.status || 'Unknown';
  };

  const handleCheckIn = async (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId);
    const shift = staffMember?.shift_id ? shifts.find(sh => sh.id === staffMember.shift_id) : null;
    let status = 'Present';
    if (shift) {
      const [shH, shM] = shift.start_time.split(':').map(Number);
      const shiftStart = new Date(); shiftStart.setHours(shH, shM + shift.late_threshold_minutes, 0);
      if (now > shiftStart) status = 'Late';
    }
    try {
      await checkInStaff(staffId, selectedDate, timeStr, status);
      toast.success(`${staffMember?.full_name} checked in as ${status}`);
      loadData();
    } catch { toast.error('Check-in failed'); }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      await checkOutStaff(staffId, selectedDate, timeStr);
      toast.success('Checked out successfully');
      loadData();
    } catch { toast.error('Check-out failed'); }
  };

  const checkedIn = staff.filter(s => {
    const att = getStaffAtt(s.id);
    return att?.check_in_time && !att?.check_out_time;
  });
  const checkedOut = staff.filter(s => {
    const att = getStaffAtt(s.id);
    return att?.check_in_time && att?.check_out_time;
  });
  const notIn = staff.filter(s => !getStaffAtt(s.id)?.check_in_time);

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/school-attendance-system"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" /> Staff Attendance
          </h1>
        </div>

        {/* Date + Live Clock */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Date</label>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-9 w-44" />
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-foreground tabular-nums">{now.toLocaleTimeString()}</p>
            <p className="text-xs text-muted-foreground">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-300">✓ In: {checkedIn.length}</Badge>
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300">↗ Out: {checkedOut.length}</Badge>
          <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-300">✗ Not In: {notIn.length}</Badge>
          <Badge variant="outline">Total: {staff.length}</Badge>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Staff</TabsTrigger>
            <TabsTrigger value="not-in">Not Checked In ({notIn.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2 mt-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : staff.map((s, i) => {
              const att = getStaffAtt(s.id);
              const statusStr = getStatus(s.id);
              const isLate = att?.status === 'Late';
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className={cn('border', isLate && 'border-amber-300 dark:border-amber-700')}>
                    <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{s.full_name}</p>
                          {isLate && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{s.designation} · #{s.employee_id}</p>
                        {att?.check_in_time && <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">In: {att.check_in_time}{att.check_out_time && ` · Out: ${att.check_out_time}`}</p>}
                      </div>
                      <Badge variant="outline" className={cn('text-xs shrink-0',
                        statusStr === 'Checked In' ? 'text-green-600 border-green-300' :
                        statusStr === 'Checked Out' ? 'text-blue-600 border-blue-300' :
                        statusStr === 'Not Checked In' ? 'text-red-600 border-red-300' : ''
                      )}>{statusStr}</Badge>
                      <div className="flex gap-2 shrink-0">
                        {!att?.check_in_time && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30 text-xs" onClick={() => handleCheckIn(s.id)}>
                            <LogIn className="h-3.5 w-3.5 mr-1" /> Check In
                          </Button>
                        )}
                        {att?.check_in_time && !att?.check_out_time && (
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs" onClick={() => handleCheckOut(s.id)}>
                            <LogOut className="h-3.5 w-3.5 mr-1" /> Check Out
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="not-in" className="space-y-2 mt-3">
            {notIn.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-50" />
                <p>All staff have checked in!</p>
              </div>
            ) : notIn.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="border-red-200 dark:border-red-800">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.designation} · #{s.employee_id}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 text-xs" onClick={() => handleCheckIn(s.id)}>
                      <LogIn className="h-3.5 w-3.5 mr-1" /> Check In Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default StaffAttendancePage;
