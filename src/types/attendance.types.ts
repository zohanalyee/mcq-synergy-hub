export interface InstituteSettings {
  id: string;
  user_id: string;
  institute_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  institute_name?: string;
  created_at: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
  created_at: string;
}

export interface AttStudent {
  id: string;
  admission_number: string;
  full_name: string;
  class_id?: string;
  section_id?: string;
  roll_number?: string;
  photo_url?: string;
  parent_mobile?: string;
  parent_email?: string;
  status: string;
  user_id?: string;
  created_at: string;
}

export interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  late_threshold_minutes: number;
  half_day_hours: number;
  is_active: boolean;
  institute_name?: string;
  created_at: string;
}

export interface AttStaff {
  id: string;
  employee_id: string;
  full_name: string;
  designation: string;
  department?: string;
  mobile?: string;
  email?: string;
  photo_url?: string;
  shift_id?: string;
  status: string;
  user_id?: string;
  created_at: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Leave' | 'Holiday';

export interface StudentAttendance {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  marked_by?: string;
  marked_at: string;
}

export interface StaffAttendance {
  id: string;
  staff_id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  status?: AttendanceStatus;
  work_hours?: number;
  overtime_hours?: number;
  location_lat?: number;
  location_lng?: number;
  remarks?: string;
  marked_by?: string;
}

export type LeaveType = 'Sick' | 'Casual' | 'Medical' | 'Other';
export type StaffLeaveType = 'CL' | 'SL' | 'EL' | 'ML' | 'PL' | 'Unpaid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface StudentLeave {
  id: string;
  student_id: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  document_url?: string;
  status: LeaveStatus;
  applied_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface StaffLeave {
  id: string;
  staff_id: string;
  leave_type: StaffLeaveType;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string;
  document_url?: string;
  status: LeaveStatus;
  applied_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface StaffLeaveBalance {
  id: string;
  staff_id: string;
  year: number;
  casual_leave: number;
  sick_leave: number;
  earned_leave: number;
  casual_used: number;
  sick_used: number;
  earned_used: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type?: 'Public' | 'Restricted' | 'Optional';
  applies_to?: 'All' | 'Staff' | 'Students';
  description?: string;
  institute_name?: string;
  created_at: string;
}

export interface OvertimeRecord {
  id: string;
  staff_id: string;
  date: string;
  overtime_hours: number;
  rate_multiplier: number;
  amount?: number;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
}

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  Present: 'bg-green-500',
  Absent: 'bg-red-500',
  Late: 'bg-yellow-500',
  'Half-day': 'bg-blue-500',
  Leave: 'bg-purple-500',
  Holiday: 'bg-gray-400',
};

export const STATUS_TEXT_COLORS: Record<AttendanceStatus, string> = {
  Present: 'text-green-600 dark:text-green-400',
  Absent: 'text-red-600 dark:text-red-400',
  Late: 'text-yellow-600 dark:text-yellow-400',
  'Half-day': 'text-blue-600 dark:text-blue-400',
  Leave: 'text-purple-600 dark:text-purple-400',
  Holiday: 'text-muted-foreground',
};
