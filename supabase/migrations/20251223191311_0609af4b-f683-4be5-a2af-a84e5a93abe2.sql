-- 1. Create Badges Table
CREATE TABLE IF NOT EXISTS public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    category text DEFAULT 'General',
    created_at timestamptz DEFAULT now()
);

-- 2. Create User Badges Table (Tracking who won what)
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- 3. Enable Security
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Seed Initial Badges
INSERT INTO public.badges (name, description, icon, category) VALUES 
('First Step', 'Completed your first quiz', '🏁', 'Participation'),
('On Fire', 'Maintained a 3-day learning streak', '🔥', 'Streak'),
('High Flyer', 'Scored 100% in a quiz', '🚀', 'Score'),
('Night Owl', 'Completed a test after 10 PM', '🦉', 'Lifestyle');