-- Create saved_syllabus_templates table for storing user templates
CREATE TABLE public.saved_syllabus_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  filter_state JSONB NOT NULL DEFAULT '{}',
  selected_topic_ids TEXT[] NOT NULL DEFAULT '{}',
  quiz_settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_syllabus_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can manage their own templates
CREATE POLICY "Users can manage their own templates"
  ON public.saved_syllabus_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_syllabus_templates_updated_at
  BEFORE UPDATE ON public.saved_syllabus_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();