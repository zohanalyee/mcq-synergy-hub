
-- Global appearance settings (single row, admin-controlled)
CREATE TABLE public.global_appearance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL DEFAULT 'default',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.global_appearance_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can read global appearance"
  ON public.global_appearance_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage global appearance"
  ON public.global_appearance_settings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- User appearance settings (per-user overrides)
CREATE TABLE public.user_appearance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_appearance_settings ENABLE ROW LEVEL SECURITY;

-- Users can read/write only their own row
CREATE POLICY "Users can manage their own appearance"
  ON public.user_appearance_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for global settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_appearance_settings;
