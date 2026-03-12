
-- Add user_id to tables that lack tenant isolation
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.sections ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.holidays ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop overly permissive RLS policies on attendance tables
DROP POLICY IF EXISTS "Authenticated users can manage att_students" ON public.att_students;
DROP POLICY IF EXISTS "Authenticated users can manage att_staff" ON public.att_staff;
DROP POLICY IF EXISTS "Authenticated users can manage classes" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can manage sections" ON public.sections;
DROP POLICY IF EXISTS "Authenticated users can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Authenticated users can manage holidays" ON public.holidays;
DROP POLICY IF EXISTS "Authenticated users can manage student_attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Authenticated users can manage staff_attendance" ON public.staff_attendance;
DROP POLICY IF EXISTS "Authenticated users can manage staff_leaves" ON public.staff_leaves;
DROP POLICY IF EXISTS "Authenticated users can manage staff_leave_balance" ON public.staff_leave_balance;
DROP POLICY IF EXISTS "Authenticated users can manage overtime_records" ON public.overtime_records;

-- att_students: scope by user_id
CREATE POLICY "Users manage own att_students" ON public.att_students FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- att_staff: scope by user_id
CREATE POLICY "Users manage own att_staff" ON public.att_staff FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- classes: scope by user_id
CREATE POLICY "Users manage own classes" ON public.classes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sections: scope through class ownership
CREATE POLICY "Users manage own sections" ON public.sections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = sections.class_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = sections.class_id AND c.user_id = auth.uid()));

-- shifts: scope by user_id
CREATE POLICY "Users manage own shifts" ON public.shifts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- holidays: scope by user_id
CREATE POLICY "Users manage own holidays" ON public.holidays FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- student_attendance: scope through student ownership
CREATE POLICY "Users manage own student_attendance" ON public.student_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_students s WHERE s.id = student_attendance.student_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_students s WHERE s.id = student_attendance.student_id AND s.user_id = auth.uid()));

-- staff_attendance: scope through staff ownership
CREATE POLICY "Users manage own staff_attendance" ON public.staff_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_attendance.staff_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_attendance.staff_id AND s.user_id = auth.uid()));

-- staff_leaves: scope through staff ownership
CREATE POLICY "Users manage own staff_leaves" ON public.staff_leaves FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_leaves.staff_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_leaves.staff_id AND s.user_id = auth.uid()));

-- student_leaves: scope through student ownership
DROP POLICY IF EXISTS "Authenticated users can manage student_leaves" ON public.student_leaves;
CREATE POLICY "Users manage own student_leaves" ON public.student_leaves FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_students s WHERE s.id = student_leaves.student_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_students s WHERE s.id = student_leaves.student_id AND s.user_id = auth.uid()));

-- staff_leave_balance: scope through staff ownership
CREATE POLICY "Users manage own staff_leave_balance" ON public.staff_leave_balance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_leave_balance.staff_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = staff_leave_balance.staff_id AND s.user_id = auth.uid()));

-- overtime_records: scope through staff ownership
CREATE POLICY "Users manage own overtime_records" ON public.overtime_records FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = overtime_records.staff_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.att_staff s WHERE s.id = overtime_records.staff_id AND s.user_id = auth.uid()));
