-- Add policy to allow users to view their own AI usage logs
-- This ensures users can only see their own usage data, not other users' data
CREATE POLICY "Users can view their own AI usage logs"
ON public.ai_usage_logs
FOR SELECT
USING (auth.uid() = triggered_by_user_id);