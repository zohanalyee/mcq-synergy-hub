
CREATE TABLE public.user_generation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  default_difficulty TEXT DEFAULT 'Medium',
  default_quantity INTEGER DEFAULT 100,
  last_board_id UUID,
  last_class_id UUID,
  last_subject_id UUID,
  last_topic_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_generation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_generation_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
