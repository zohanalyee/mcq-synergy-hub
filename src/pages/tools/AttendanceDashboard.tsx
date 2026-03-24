import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, UserCheck, Calendar, ClipboardList, BarChart3,
  Building2, Settings, Plus, ChevronRight, Clock, AlertTriangle,
  CheckCircle2, XCircle, Timer, Briefcase, BookOpen, Bell, PenLine, TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInstituteSettings, upsertInstituteSettings, getStudents, getStaff, getStudentLeaves, getStaffLeaves } from '@/services/attendanceService';
import type { InstituteSettings } from '@/types/attendance.types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AttendanceDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState<InstituteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupAddress, setSetupAddress] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ students: 0, staff: 0, pendingLeaves: 0 });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const inst = await getInstituteSettings(user!.id);
      setInstitute(inst);
      if (inst) {
        const [students, staff, sLeaves, staffLeaves] = await Promise.all([
          getStudents(), getStaff(), getStudentLeaves(), getStaffLeaves()
        ]);
        const pendingLeaves = [...sLeaves, ...staffLeaves].filter(l => l.status === 'Pending').length;
        setStats({ students: students.length, staff: staff.length, pendingLeaves });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!setupName.trim()) return toast.error('Institute name is required');
    setSaving(true);
    try {
      const inst = await upsertInstituteSettings({
        user_id: user!.id,
        institute_name: setupName,
        address: setupAddress,
        phone: setupPhone,
      });
      setInstitute(inst as InstituteSettings);
      setShowSetup(false);
      toast.success('Institute setup complete!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const modules = [
    { icon: UserCheck, label: 'Mark Student Attendance', desc: 'Mark daily class attendance', href: '/tools/hr/student-attendance', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    { icon: PenLine, label: 'Quick Manual Entry', desc: 'Enter class-wise attendance (ECE–XII)', href: '/tools/hr/quick-entry', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    { icon: Briefcase, label: 'Staff Attendance', desc: 'Track staff check-in/check-out', href: '/tools/hr/staff-attendance', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    { icon: ClipboardList, label: 'Leave Management', desc: 'Apply & approve leave requests', href: '/tools/hr/leaves', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    { icon: Calendar, label: 'Holiday Calendar', desc: 'Manage holidays & events', href: '/tools/hr/holidays', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    { icon: TrendingUp, label: 'Analytics Dashboard', desc: 'Charts, reports & PDF export', href: '/tools/hr/analytics', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
    { icon: BarChart3, label: 'Reports & Analytics', desc: 'Student attendance reports', href: '/tools/hr/reports', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
    { icon: Settings, label: 'Setup & Configuration', desc: 'Students, staff, shifts & classes', href: '/tools/hr/setup', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  ];

  if (loading) return (
    <Header>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </Header>
  );

  if (!user) return (
    <Header>
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
        <h2 className="text-xl font-bold">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to access the School Attendance  System.</p>
        <Button asChild><Link to="/signin">Sign In</Link></Button>
      </div>
    </Header>
  );

  if (!institute) return (
    <Header>
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Attendance & HR System</h1>
          <p className="text-muted-foreground mt-2">Set up your institute to get started with comprehensive attendance tracking and HR management.</p>
          
          <div className="mt-8 p-6 rounded-2xl border border-border bg-card space-y-4 text-left">
            <h2 className="font-semibold text-foreground">Institute Setup</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="iname">Institute Name *</Label>
                <Input id="iname" placeholder="e.g. Sunrise Public School" value={setupName} onChange={e => setSetupName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="iaddr">Address (optional)</Label>
                <Input id="iaddr" placeholder="123 Education Street" value={setupAddress} onChange={e => setSetupAddress(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="iphone">Phone (optional)</Label>
                <Input id="iphone" placeholder="+92 300 1234567" value={setupPhone} onChange={e => setSetupPhone(e.target.value)} className="mt-1" />
              </div>
            </div>
            <Button className="w-full" onClick={handleSetup} disabled={saving}>
              {saving ? 'Setting up...' : 'Set Up Institute →'}
            </Button>
          </div>
        </motion.div>
      </div>
    </Header>
  );

  return (
    <Header>
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{institute.institute_name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">Attendance & HR Management System</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tools/hr/setup"><Settings className="h-4 w-4 mr-1" /> Configure</Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: stats.students, icon: BookOpen, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
            { label: 'Total Staff', value: stats.staff, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Pending Leaves', value: stats.pendingLeaves, icon: Bell, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: "Today's Date", value: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), icon: Calendar, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border ${stat.bg}`}>
                <CardContent className="p-4 flex items-center gap-3">
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

        {/* Modules Grid */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Modules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {modules.map((mod, i) => (
              <motion.div key={mod.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}>
                <Link to={mod.href} className={`flex items-center gap-4 p-4 rounded-xl border ${mod.border} bg-card hover:shadow-md transition-all group`}>
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${mod.color} shrink-0`}>
                    <mod.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{mod.label}</p>
                    <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-1">🚀 Quick Start Guide</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to <strong>Setup & Configuration</strong> to add classes, sections, students, and staff</li>
              <li>Use <strong>Mark Student Attendance</strong> daily for each class</li>
              <li>Staff can use <strong>Staff Attendance</strong> to check in/out</li>
              <li>Manage leave requests from <strong>Leave Management</strong></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default AttendanceDashboard;
