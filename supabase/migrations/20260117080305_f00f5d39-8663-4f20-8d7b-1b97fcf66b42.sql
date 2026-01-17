-- Step 1: Create system_settings table for configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only
CREATE POLICY "Admins can view system settings"
ON public.system_settings FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update system settings"
ON public.system_settings FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can insert system settings"
ON public.system_settings FOR INSERT
WITH CHECK (is_admin());

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
('ai_daily_limit', '{"max_requests": 50, "max_questions": 500}', 'Daily AI generation limits for free tier'),
('auto_fill_config', '{"enabled": false, "min_threshold": 10, "batch_size": 20, "priority": "lowest_first"}', 'Auto-fill feature configuration'),
('low_content_threshold', '{"warning": 10, "critical": 5}', 'Thresholds for flagging low-content topics')
ON CONFLICT (key) DO NOTHING;

-- Step 2: Add topic_id column to content_items for proper FK relationship
ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_content_items_topic_id ON public.content_items(topic_id);

-- Step 3: Create get_ai_usage_today RPC function
CREATE OR REPLACE FUNCTION public.get_ai_usage_today()
RETURNS TABLE(
  total_requests BIGINT,
  total_questions_requested BIGINT,
  total_questions_saved BIGINT,
  daily_limit INTEGER,
  remaining_requests INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER;
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get daily limit from settings
  SELECT (value->>'max_requests')::INTEGER INTO v_limit
  FROM system_settings WHERE key = 'ai_daily_limit';
  
  v_limit := COALESCE(v_limit, 50); -- Default 50
  
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_requests,
    COALESCE(SUM(questions_requested), 0)::BIGINT as total_questions_requested,
    COALESCE(SUM(questions_saved), 0)::BIGINT as total_questions_saved,
    v_limit as daily_limit,
    GREATEST(0, v_limit - COUNT(*)::INTEGER) as remaining_requests
  FROM ai_usage_logs
  WHERE DATE(created_at) = CURRENT_DATE;
END;
$$;

-- Step 4: Create get_autofill_queue RPC function
CREATE OR REPLACE FUNCTION public.get_autofill_queue(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  topic_id UUID,
  topic_name TEXT,
  subject_id UUID,
  subject_name TEXT,
  level_name TEXT,
  system_name TEXT,
  current_count BIGINT,
  questions_needed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold INTEGER;
  v_batch_size INTEGER;
BEGIN
  -- Verify caller is an admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Get config from settings
  SELECT 
    (value->>'min_threshold')::INTEGER,
    (value->>'batch_size')::INTEGER
  INTO v_threshold, v_batch_size
  FROM system_settings WHERE key = 'auto_fill_config';
  
  v_threshold := COALESCE(v_threshold, 10);
  v_batch_size := COALESCE(v_batch_size, 20);
  
  RETURN QUERY
  SELECT 
    t.id as topic_id,
    t.name::TEXT as topic_name,
    s.id as subject_id,
    s.name::TEXT as subject_name,
    l.name::TEXT as level_name,
    es.name::TEXT as system_name,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0)::BIGINT as current_count,
    LEAST(v_batch_size, v_threshold - COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0)::INTEGER) as questions_needed
  FROM topics t
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN levels l ON s.level_id = l.id
  LEFT JOIN educational_systems es ON l.system_id = es.id
  LEFT JOIN content_items ci ON (
    ci.topic_id = t.id 
    OR (ci.topic_id IS NULL AND LOWER(ci.topic) = LOWER(t.name) AND LOWER(ci.subject) = LOWER(s.name))
  )
  GROUP BY t.id, t.name, s.id, s.name, l.name, es.name
  HAVING COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) < v_threshold
  ORDER BY COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) ASC
  LIMIT limit_count;
END;
$$;

-- Step 5: Create get_lms_content_inventory RPC function
CREATE OR REPLACE FUNCTION public.get_lms_content_inventory()
RETURNS TABLE(
  system_name TEXT,
  level_name TEXT,
  subject_name TEXT,
  topic_id UUID,
  topic_name TEXT,
  question_count BIGINT,
  is_low_content BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold INTEGER;
BEGIN
  -- Get threshold from settings
  SELECT (value->>'warning')::INTEGER INTO v_threshold
  FROM system_settings WHERE key = 'low_content_threshold';
  
  v_threshold := COALESCE(v_threshold, 10);

  RETURN QUERY
  SELECT 
    es.name::TEXT as system_name,
    l.name::TEXT as level_name,
    s.name::TEXT as subject_name,
    t.id as topic_id,
    t.name::TEXT as topic_name,
    COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0)::BIGINT as question_count,
    (COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) < v_threshold) as is_low_content
  FROM topics t
  LEFT JOIN subjects s ON t.subject_id = s.id
  LEFT JOIN levels l ON s.level_id = l.id
  LEFT JOIN educational_systems es ON l.system_id = es.id
  LEFT JOIN content_items ci ON (
    ci.topic_id = t.id 
    OR (ci.topic_id IS NULL AND LOWER(ci.topic) = LOWER(t.name) AND LOWER(ci.subject) = LOWER(s.name))
  )
  GROUP BY es.name, l.name, s.name, t.id, t.name
  ORDER BY COALESCE(COUNT(ci.id) FILTER (WHERE ci.category = 'mcq' AND ci.status = 'approved'), 0) ASC, es.name, l.name, s.name, t.name;
END;
$$;