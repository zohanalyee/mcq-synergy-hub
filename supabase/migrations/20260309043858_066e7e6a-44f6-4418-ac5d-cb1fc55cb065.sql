
-- Classes and Sections
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  institute_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students (for attendance, not auth users)
CREATE TABLE public.att_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  section_id UUID REFERENCES public.sections(id),
  roll_number TEXT,
  photo_url TEXT,
  parent_mobile TEXT,
  parent_email TEXT,
  status TEXT DEFAULT 'Active',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shifts
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  late_threshold_minutes INTEGER DEFAULT 15,
  half_day_hours DECIMAL(3,1) DEFAULT 4.0,
  is_active BOOLEAN DEFAULT true,
  institute_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Staff
CREATE TABLE public.att_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT,
  mobile TEXT,
  email TEXT,
  photo_url TEXT,
  shift_id UUID REFERENCES public.shifts(id),
  status TEXT DEFAULT 'Active',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student Attendance
CREATE TABLE public.student_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.att_students(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Half-day', 'Leave', 'Holiday')),
  remarks TEXT,
  marked_by UUID,
  marked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Staff Attendance
CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.att_staff(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Half-day', 'Leave', 'Holiday')),
  work_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  remarks TEXT,
  marked_by UUID,
  UNIQUE(staff_id, date)
);

-- Student Leaves
CREATE TABLE public.student_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.att_students(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Staff Leaves
CREATE TABLE public.staff_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.att_staff(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('CL', 'SL', 'EL', 'ML', 'PL', 'Unpaid')),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  total_days DECIMAL(3,1) NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Staff Leave Balance
CREATE TABLE public.staff_leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.att_staff(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  casual_leave DECIMAL(3,1) DEFAULT 12,
  sick_leave DECIMAL(3,1) DEFAULT 10,
  earned_leave DECIMAL(3,1) DEFAULT 15,
  casual_used DECIMAL(3,1) DEFAULT 0,
  sick_used DECIMAL(3,1) DEFAULT 0,
  earned_used DECIMAL(3,1) DEFAULT 0,
  UNIQUE(staff_id, year)
);

-- Holidays
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('Public', 'Restricted', 'Optional')),
  applies_to TEXT CHECK (applies_to IN ('All', 'Staff', 'Students')),
  description TEXT,
  institute_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Overtime Records
CREATE TABLE public.overtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.att_staff(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  overtime_hours DECIMAL(4,2) NOT NULL,
  rate_multiplier DECIMAL(3,1) DEFAULT 1.5,
  amount DECIMAL(10,2),
  approved BOOLEAN DEFAULT false,
  approved_by UUID,
  approved_at TIMESTAMPTZ
);

-- Institute Settings (store institute name per user)
CREATE TABLE public.institute_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  institute_name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.att_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.att_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institute_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can manage all (since this is a tool, the user manages their own institute data)
-- Institute Settings
CREATE POLICY "Users can manage own institute" ON public.institute_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- For tool-based tables, allow authenticated users full access (they manage their own institute)
CREATE POLICY "Authenticated users can manage classes" ON public.classes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage sections" ON public.sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage att_students" ON public.att_students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage shifts" ON public.shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage att_staff" ON public.att_staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage student_attendance" ON public.student_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage staff_attendance" ON public.staff_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage student_leaves" ON public.student_leaves FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage staff_leaves" ON public.staff_leaves FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage staff_leave_balance" ON public.staff_leave_balance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage holidays" ON public.holidays FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage overtime_records" ON public.overtime_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
