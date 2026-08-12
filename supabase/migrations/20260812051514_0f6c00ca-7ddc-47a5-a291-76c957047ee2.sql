UPDATE public.system_settings
SET value = jsonb_build_object(
  'enabled', true,
  'scope_keywords', jsonb_build_array('mdcat'),
  'target_per_topic', 15,
  'daily_budget', 600
), updated_at = now()
WHERE key = 'content_fill_sprint';

INSERT INTO public.system_settings (key, value, description)
SELECT 'content_fill_sprint', jsonb_build_object(
  'enabled', true,
  'scope_keywords', jsonb_build_array('mdcat'),
  'target_per_topic', 15,
  'daily_budget', 600
), 'Content fill sprint scope and budget'
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'content_fill_sprint');