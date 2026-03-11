
-- Table for quick manual class-wise attendance entry
CREATE TABLE IF NOT EXISTS public.class_attendance_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  present_students INTEGER NOT NULL DEFAULT 0,
  absent_students INTEGER NOT NULL DEFAULT 0,
  attendance_percentage INTEGER NOT NULL DEFAULT 0,
  attendance_date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, attendance_date)
);

-- Enable RLS
ALTER TABLE public.class_attendance_summary ENABLE ROW LEVEL SECURITY;

-- RLS policy: authenticated users can manage their own records
CREATE POLICY "Users can manage own attendance summaries"
  ON public.class_attendance_summary
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow admins full access
CREATE POLICY "Admins can manage all attendance summaries"
  ON public.class_attendance_summary
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_summary_date ON public.class_attendance_summary(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_class ON public.class_attendance_summary(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_summary_user ON public.class_attendance_summary(user_id);
