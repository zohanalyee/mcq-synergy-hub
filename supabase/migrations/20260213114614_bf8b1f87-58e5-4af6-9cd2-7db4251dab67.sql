
-- Phase 1: Add approval tracking columns to all LMS tables

-- Educational Systems (Boards)
ALTER TABLE public.educational_systems ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE public.educational_systems ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
ALTER TABLE public.educational_systems ADD COLUMN IF NOT EXISTS created_by_ai boolean DEFAULT false;
ALTER TABLE public.educational_systems ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;
ALTER TABLE public.educational_systems ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid;

-- Levels (Classes)
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS created_by_ai boolean DEFAULT false;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid;

-- Subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS created_by_ai boolean DEFAULT false;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid;

-- Topics
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS auto_created boolean DEFAULT false;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS approved boolean DEFAULT true;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS created_by_ai boolean DEFAULT false;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS ai_suggested_name text;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS ai_confidence decimal;

-- Mark ALL existing data as approved
UPDATE public.educational_systems SET approved = true, auto_created = false WHERE approved IS NULL;
UPDATE public.levels SET approved = true, auto_created = false WHERE approved IS NULL;
UPDATE public.subjects SET approved = true, auto_created = false WHERE approved IS NULL;
UPDATE public.topics SET approved = true, auto_created = false WHERE approved IS NULL;

-- Create LMS Approvals tracking table
CREATE TABLE IF NOT EXISTS public.lms_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  ai_metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lms_approvals_status ON public.lms_approvals(status);
CREATE INDEX IF NOT EXISTS idx_lms_approvals_entity ON public.lms_approvals(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.lms_approvals ENABLE ROW LEVEL SECURITY;

-- RLS: Admin-only access
CREATE POLICY "Admins can manage all approvals"
  ON public.lms_approvals
  FOR ALL
  USING (is_admin());

-- RLS: Allow edge functions with service role to insert
CREATE POLICY "Service role can insert approvals"
  ON public.lms_approvals
  FOR INSERT
  WITH CHECK (true);
