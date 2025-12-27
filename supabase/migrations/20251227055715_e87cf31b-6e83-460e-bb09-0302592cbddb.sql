-- Phase 1: Create AI Usage Logs table for tracking all AI requests

CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  triggered_by_user_id UUID,
  source_type TEXT NOT NULL CHECK (source_type IN ('user_test_session', 'admin_bulk_generator')),
  subject TEXT,
  topic TEXT,
  difficulty TEXT,
  questions_requested INTEGER NOT NULL DEFAULT 0,
  questions_fetched INTEGER NOT NULL DEFAULT 0,
  questions_saved INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_source_type ON public.ai_usage_logs(source_type);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(triggered_by_user_id);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all logs
CREATE POLICY "Admins can view all AI usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (is_admin());

-- Policy: Edge function (service role) can insert logs
CREATE POLICY "Service can insert AI usage logs"
ON public.ai_usage_logs
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.ai_usage_logs IS 'Tracks all AI generation requests for cost monitoring and efficiency analysis';