-- 1. Create Tables (Safe to run, won't delete anything)
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text DEFAULT 'General',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 2. Security Policies (RLS)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid "Policy already exists" error, then recreate
DROP POLICY IF EXISTS "Public view badges" ON public.badges;
CREATE POLICY "Public view badges" ON public.badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users view own" ON public.user_badges;
CREATE POLICY "Users view own" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System award" ON public.user_badges;
CREATE POLICY "System award" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. INSERT BADGES (with conflict handling to avoid duplicates)
INSERT INTO public.badges (name, description, icon, category) VALUES 
('First Step', 'Completed your first quiz', '🏁', 'Participation'),
('On Fire', 'Maintained a 3-day learning streak', '🔥', 'Streak'),
('High Flyer', 'Scored 100% in a quiz', '🚀', 'Score')
ON CONFLICT DO NOTHING;