import { supabase } from '@/integrations/supabase/client';
import type {
  InstituteSettings, Class, Section, AttStudent, AttStaff,
  Shift, StudentAttendance, StaffAttendance, StudentLeave,
  StaffLeave, Holiday, OvertimeRecord
} from '@/types/attendance.types';

const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
};

// ── Institute Settings ────────────────────────────────────────────────────────
export const getInstituteSettings = async (userId: string): Promise<InstituteSettings | null> => {
  const { data } = await supabase
    .from('institute_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as InstituteSettings | null;
};

export const upsertInstituteSettings = async (settings: Partial<InstituteSettings> & { user_id: string }) => {
  const { data, error } = await supabase
    .from('institute_settings')
    .upsert([settings] as any, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Classes ───────────────────────────────────────────────────────────────────
export const getClasses = async (): Promise<Class[]> => {
  const { data, error } = await supabase.from('classes').select('*').order('name');
  if (error) throw error;
  return (data || []) as Class[];
};

export const addClass = async (cls: Omit<Class, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('classes').insert(cls).select().single();
  if (error) throw error;
  return data;
};

export const deleteClass = async (id: string) => {
  const { error } = await supabase.from('classes').delete().eq('id', id);
  if (error) throw error;
};

// ── Sections ──────────────────────────────────────────────────────────────────
export const getSections = async (classId?: string): Promise<Section[]> => {
  let q = supabase.from('sections').select('*').order('name');
  if (classId) q = q.eq('class_id', classId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Section[];
};

export const addSection = async (section: Omit<Section, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('sections').insert(section).select().single();
  if (error) throw error;
  return data;
};

// ── Students ──────────────────────────────────────────────────────────────────
export const getStudents = async (classId?: string, sectionId?: string): Promise<AttStudent[]> => {
  let q = supabase.from('att_students').select('*').eq('status', 'Active').order('roll_number');
  if (classId === '__unassigned__') {
    q = q.is('class_id', null);
  } else if (classId) {
    q = q.eq('class_id', classId);
  }
  if (sectionId === '__unassigned__') {
    q = q.is('section_id', null);
  } else if (sectionId) {
    q = q.eq('section_id', sectionId);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as AttStudent[];
};

export const bulkAssignStudentsClass = async (studentIds: string[], classId: string, sectionId?: string) => {
  const updates: Record<string, any> = { class_id: classId };
  if (sectionId) updates.section_id = sectionId;
  const { error } = await supabase
    .from('att_students')
    .update(updates)
    .in('id', studentIds);
  if (error) throw error;
};

export const addStudent = async (student: Omit<AttStudent, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('att_students').insert(student).select().single();
  if (error) throw error;
  return data;
};

export const updateStudent = async (id: string, updates: Partial<AttStudent>) => {
  const { data, error } = await supabase.from('att_students').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from('att_students').delete().eq('id', id);
  if (error) throw error;
};

export const deleteAllStudents = async () => {
  const { error } = await supabase.from('att_students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
};

// ── Shifts ────────────────────────────────────────────────────────────────────
export const getShifts = async (): Promise<Shift[]> => {
  const { data, error } = await supabase.from('shifts').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return (data || []) as Shift[];
};

export const addShift = async (shift: Omit<Shift, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('shifts').insert(shift).select().single();
  if (error) throw error;
  return data;
};

// ── Staff ─────────────────────────────────────────────────────────────────────
export const getStaff = async (): Promise<AttStaff[]> => {
  const { data, error } = await supabase.from('att_staff').select('*').eq('status', 'Active').order('full_name');
  if (error) throw error;
  return (data || []) as AttStaff[];
};

export const addStaff = async (staff: Omit<AttStaff, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('att_staff').insert(staff).select().single();
  if (error) throw error;
  return data;
};

export const updateStaff = async (id: string, updates: Partial<AttStaff>) => {
  const { data, error } = await supabase.from('att_staff').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

// ── Student Attendance ────────────────────────────────────────────────────────
export const getStudentAttendance = async (studentId: string, fromDate: string, toDate: string): Promise<StudentAttendance[]> => {
  const { data, error } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date');
  if (error) throw error;
  return (data || []) as StudentAttendance[];
};

export const getClassAttendanceForDate = async (classId: string, sectionId: string, date: string) => {
  const students = await getStudents(classId, sectionId || undefined);
  const studentIds = students.map(s => s.id);
  
  if (studentIds.length === 0) return { students, attendance: {} };

  // Supabase has a limit; batch if needed
  const batchSize = 200;
  let allData: any[] = [];
  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batch = studentIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('student_attendance')
      .select('*')
      .in('student_id', batch)
      .eq('date', date);
    if (error) throw error;
    allData = allData.concat(data || []);
  }
  
  const attendanceMap: Record<string, StudentAttendance> = {};
  allData.forEach((a: any) => { attendanceMap[a.student_id] = a as StudentAttendance; });
  
  return { students, attendance: attendanceMap };
};

export const saveStudentAttendance = async (records: Omit<StudentAttendance, 'id' | 'marked_at'>[]) => {
  const { error } = await supabase
    .from('student_attendance')
    .upsert(records, { onConflict: 'student_id,date' });
  if (error) throw error;
};

// ── Staff Attendance ──────────────────────────────────────────────────────────
export const getStaffAttendanceForDate = async (date: string): Promise<StaffAttendance[]> => {
  const { data, error } = await supabase
    .from('staff_attendance')
    .select('*')
    .eq('date', date);
  if (error) throw error;
  return (data || []) as StaffAttendance[];
};

export const checkInStaff = async (staffId: string, date: string, checkInTime: string, status: string) => {
  const { error } = await supabase
    .from('staff_attendance')
    .upsert({ staff_id: staffId, date, check_in_time: checkInTime, status }, { onConflict: 'staff_id,date' });
  if (error) throw error;
};

export const checkOutStaff = async (staffId: string, date: string, checkOutTime: string) => {
  const { error } = await supabase
    .from('staff_attendance')
    .update({ check_out_time: checkOutTime })
    .eq('staff_id', staffId)
    .eq('date', date);
  if (error) throw error;
};

// ── Student Leaves ────────────────────────────────────────────────────────────
export const getStudentLeaves = async (studentId?: string): Promise<StudentLeave[]> => {
  let q = supabase.from('student_leaves').select('*').order('applied_at', { ascending: false });
  if (studentId) q = q.eq('student_id', studentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as StudentLeave[];
};

export const applyStudentLeave = async (leave: Omit<StudentLeave, 'id' | 'applied_at' | 'approved_by' | 'approved_at' | 'rejection_reason'>) => {
  const { data, error } = await supabase.from('student_leaves').insert(leave).select().single();
  if (error) throw error;
  return data;
};

export const updateStudentLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', approvedBy: string, rejectionReason?: string) => {
  const { error } = await supabase
    .from('student_leaves')
    .update({ status, approved_by: approvedBy, approved_at: new Date().toISOString(), rejection_reason: rejectionReason })
    .eq('id', id);
  if (error) throw error;
};

// ── Staff Leaves ──────────────────────────────────────────────────────────────
export const getStaffLeaves = async (staffId?: string): Promise<StaffLeave[]> => {
  let q = supabase.from('staff_leaves').select('*').order('applied_at', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as StaffLeave[];
};

export const applyStaffLeave = async (leave: Omit<StaffLeave, 'id' | 'applied_at' | 'approved_by' | 'approved_at' | 'rejection_reason'>) => {
  const { data, error } = await supabase.from('staff_leaves').insert(leave).select().single();
  if (error) throw error;
  return data;
};

export const updateStaffLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', approvedBy: string, rejectionReason?: string) => {
  const { error } = await supabase
    .from('staff_leaves')
    .update({ status, approved_by: approvedBy, approved_at: new Date().toISOString(), rejection_reason: rejectionReason })
    .eq('id', id);
  if (error) throw error;
};

// ── Holidays ──────────────────────────────────────────────────────────────────
export const getHolidays = async (): Promise<Holiday[]> => {
  const { data, error } = await supabase.from('holidays').select('*').order('date');
  if (error) throw error;
  return (data || []) as Holiday[];
};

export const addHoliday = async (holiday: Omit<Holiday, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('holidays').insert(holiday).select().single();
  if (error) throw error;
  return data;
};

export const deleteHoliday = async (id: string) => {
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw error;
};

// ── Overtime ──────────────────────────────────────────────────────────────────
export const getOvertimeRecords = async (staffId?: string): Promise<OvertimeRecord[]> => {
  let q = supabase.from('overtime_records').select('*').order('date', { ascending: false });
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as OvertimeRecord[];
};
