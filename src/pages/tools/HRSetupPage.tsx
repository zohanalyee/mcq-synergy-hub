import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChevronLeft, Plus, Trash2, Building2, Users, UserCheck, Clock, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getClasses, addClass, deleteClass,
  getSections, addSection,
  getStudents, addStudent, deleteStudent,
  getStaff, addStaff, updateStaff,
  getShifts, addShift,
  getInstituteSettings, upsertInstituteSettings
} from '@/services/attendanceService';
import type { Class, Section, AttStudent, AttStaff, Shift } from '@/types/attendance.types';
import { useAuth } from '@/contexts/AuthContext';

const HRSetupPage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<AttStudent[]>([]);
  const [staff, setStaff] = useState<AttStaff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Forms
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState({ class_id: '', name: '' });
  const [newStudent, setNewStudent] = useState({ admission_number: '', full_name: '', class_id: '', section_id: '', roll_number: '', parent_mobile: '', parent_email: '' });
  const [newStaff, setNewStaff] = useState({ employee_id: '', full_name: '', designation: '', department: '', mobile: '', email: '' });
  const [newShift, setNewShift] = useState({ name: '', start_time: '08:00', end_time: '16:00', late_threshold_minutes: 15, half_day_hours: 4, is_active: true });
  const [instituteName, setInstituteName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [c, sec, stu, st, sh] = await Promise.all([
        getClasses(), getSections(), getStudents(), getStaff(), getShifts()
      ]);
      setClasses(c); setSections(sec); setStudents(stu); setStaff(st); setShifts(sh);
      if (user) {
        const inst = await getInstituteSettings(user.id);
        if (inst) setInstituteName(inst.institute_name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.trim()) return;
    try {
      await addClass({ name: newClass });
      setNewClass('');
      toast.success('Class added');
      getClasses().then(setClasses);
    } catch { toast.error('Failed to add class'); }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteClass(id);
      toast.success('Class deleted');
      getClasses().then(setClasses);
    } catch { toast.error('Failed to delete class'); }
  };

  const handleAddSection = async () => {
    if (!newSection.name.trim() || !newSection.class_id) return;
    try {
      await addSection(newSection);
      setNewSection({ class_id: '', name: '' });
      toast.success('Section added');
      getSections().then(setSections);
    } catch { toast.error('Failed to add section'); }
  };

  const handleAddStudent = async () => {
    if (!newStudent.full_name.trim() || !newStudent.admission_number.trim()) return;
    try {
      await addStudent({ ...newStudent, status: 'Active' });
      setNewStudent({ admission_number: '', full_name: '', class_id: '', section_id: '', roll_number: '', parent_mobile: '', parent_email: '' });
      toast.success('Student added');
      getStudents().then(setStudents);
    } catch { toast.error('Failed to add student'); }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      toast.success('Student deleted');
      getStudents().then(setStudents);
    } catch { toast.error('Failed to delete student'); }
  };

  const handleAddStaff = async () => {
    if (!newStaff.full_name.trim() || !newStaff.employee_id.trim() || !newStaff.designation.trim()) return;
    try {
      await addStaff({ ...newStaff, status: 'Active' });
      setNewStaff({ employee_id: '', full_name: '', designation: '', department: '', mobile: '', email: '' });
      toast.success('Staff member added');
      getStaff().then(setStaff);
    } catch { toast.error('Failed to add staff'); }
  };

  const handleAddShift = async () => {
    if (!newShift.name.trim()) return;
    try {
      await addShift(newShift);
      setNewShift({ name: '', start_time: '08:00', end_time: '16:00', late_threshold_minutes: 15, half_day_hours: 4, is_active: true });
      toast.success('Shift added');
      getShifts().then(setShifts);
    } catch { toast.error('Failed to add shift'); }
  };

  const handleUpdateInstitute = async () => {
    if (!instituteName.trim() || !user) return;
    try {
      await upsertInstituteSettings({ user_id: user.id, institute_name: instituteName });
      toast.success('Institute name updated!');
    } catch { toast.error('Failed to update'); }
  };

  return (
    <Header>
      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tools/hr"><ChevronLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 text-rose-600" /> Setup & Configuration
          </h1>
        </div>

        <Tabs defaultValue="institute">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="institute">Institute</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
          </TabsList>

          {/* Institute */}
          <TabsContent value="institute">
            <Card>
              <CardHeader><CardTitle className="text-base">Institute Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Institute Name</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={instituteName} onChange={e => setInstituteName(e.target.value)} placeholder="e.g. Sunrise Public School" />
                    <Button onClick={handleUpdateInstitute}>Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classes */}
          <TabsContent value="classes" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Class & Section</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Class name (e.g. Class 10)" value={newClass} onChange={e => setNewClass(e.target.value)} />
                  <Button onClick={handleAddClass}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2">
                  <Select value={newSection.class_id} onValueChange={v => setNewSection(p => ({ ...p, class_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Section (e.g. A)" value={newSection.name} onChange={e => setNewSection(p => ({ ...p, name: e.target.value }))} className="w-28" />
                  <Button onClick={handleAddSection}><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classes.map(cls => (
                <Card key={cls.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Sections: {sections.filter(s => s.class_id === cls.id).map(s => s.name).join(', ') || 'None'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteClass(cls.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Students */}
          <TabsContent value="students" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Student</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Admission No *" value={newStudent.admission_number} onChange={e => setNewStudent(p => ({ ...p, admission_number: e.target.value }))} />
                <Input placeholder="Full Name *" value={newStudent.full_name} onChange={e => setNewStudent(p => ({ ...p, full_name: e.target.value }))} />
                <Select value={newStudent.class_id} onValueChange={v => setNewStudent(p => ({ ...p, class_id: v, section_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={newStudent.section_id} onValueChange={v => setNewStudent(p => ({ ...p, section_id: v }))} disabled={!newStudent.class_id}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>{sections.filter(s => s.class_id === newStudent.class_id).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Roll No" value={newStudent.roll_number} onChange={e => setNewStudent(p => ({ ...p, roll_number: e.target.value }))} />
                <Input placeholder="Parent Mobile" value={newStudent.parent_mobile} onChange={e => setNewStudent(p => ({ ...p, parent_mobile: e.target.value }))} />
                <Input placeholder="Parent Email" value={newStudent.parent_email} onChange={e => setNewStudent(p => ({ ...p, parent_email: e.target.value }))} />
                <Button onClick={handleAddStudent}><Plus className="h-4 w-4 mr-1" /> Add Student</Button>
              </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground">{students.length} students total</div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {students.map(s => (
                <Card key={s.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">#{s.admission_number} · Roll: {s.roll_number || '-'}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteStudent(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Staff */}
          <TabsContent value="staff" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Staff Member</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Employee ID *" value={newStaff.employee_id} onChange={e => setNewStaff(p => ({ ...p, employee_id: e.target.value }))} />
                <Input placeholder="Full Name *" value={newStaff.full_name} onChange={e => setNewStaff(p => ({ ...p, full_name: e.target.value }))} />
                <Input placeholder="Designation *" value={newStaff.designation} onChange={e => setNewStaff(p => ({ ...p, designation: e.target.value }))} />
                <Input placeholder="Department" value={newStaff.department} onChange={e => setNewStaff(p => ({ ...p, department: e.target.value }))} />
                <Input placeholder="Mobile" value={newStaff.mobile} onChange={e => setNewStaff(p => ({ ...p, mobile: e.target.value }))} />
                <Input placeholder="Email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} />
                <Button onClick={handleAddStaff} className="sm:col-span-2"><Plus className="h-4 w-4 mr-1" /> Add Staff</Button>
              </CardContent>
            </Card>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {staff.map(s => (
                <Card key={s.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.designation} · {s.department || 'No dept'} · #{s.employee_id}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{s.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Shifts */}
          <TabsContent value="shifts" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Add Shift</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Input placeholder="Shift name *" value={newShift.name} onChange={e => setNewShift(p => ({ ...p, name: e.target.value }))} />
                <div>
                  <Label className="text-xs">Start Time</Label>
                  <Input type="time" value={newShift.start_time} onChange={e => setNewShift(p => ({ ...p, start_time: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">End Time</Label>
                  <Input type="time" value={newShift.end_time} onChange={e => setNewShift(p => ({ ...p, end_time: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Late After (min)</Label>
                  <Input type="number" value={newShift.late_threshold_minutes} onChange={e => setNewShift(p => ({ ...p, late_threshold_minutes: +e.target.value }))} className="mt-1" />
                </div>
                <Button onClick={handleAddShift} className="sm:col-span-2 mt-auto"><Plus className="h-4 w-4 mr-1" /> Add Shift</Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {shifts.map(s => (
                <Card key={s.id} className="border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.start_time} – {s.end_time} · Late after {s.late_threshold_minutes}min</p>
                    </div>
                    <Badge variant={s.is_active ? 'default' : 'secondary'} className="text-xs">{s.is_active ? 'Active' : 'Inactive'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default HRSetupPage;
