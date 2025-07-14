-- Fix content deletion issues by updating RLS policies

-- Drop ALL existing policies on content_items first
DROP POLICY IF EXISTS "Admin can manage all content" ON public.content_items;
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.content_items;
DROP POLICY IF EXISTS "Authenticated users can insert content" ON public.content_items;
DROP POLICY IF EXISTS "Users can update their own content" ON public.content_items;
DROP POLICY IF EXISTS "Users can view their own content" ON public.content_items;

-- Create a user roles table for proper role management
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'moderator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role or is one of the hardcoded admin emails
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = is_admin.user_id AND role = 'admin'
    ) OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = is_admin.user_id 
        AND profiles.username IN ('zohaib.ibapsl@gmail.com', 'zohaibalichanna@gmail.com')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new comprehensive RLS policies for content_items
CREATE POLICY "Admins can manage all content" 
ON public.content_items 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Anyone can view approved content" 
ON public.content_items 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own content" 
ON public.content_items 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can insert content" 
ON public.content_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own content" 
ON public.content_items 
FOR UPDATE 
USING (auth.uid() = created_by OR public.is_admin());

CREATE POLICY "Admins and owners can delete content" 
ON public.content_items 
FOR DELETE 
USING (auth.uid() = created_by OR public.is_admin());

-- RLS policies for user_roles table
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Insert admin roles for existing admin users
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'
FROM public.profiles p
WHERE p.username IN ('zohaib.ibapsl@gmail.com', 'zohaibalichanna@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;