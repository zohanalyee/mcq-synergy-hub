-- Phase 1: Critical Security Fixes

-- 1. Fix profiles table RLS policy - restrict to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. Update is_admin() function to remove hardcoded emails and add security
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has admin role in user_roles table
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = is_admin.user_id 
        AND role = 'admin'
    );
END;
$$;

-- 3. Ensure proper RLS on user_roles table (already exists but let's verify)
-- Users should only be able to view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. Add policy to allow admins to view all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- 5. Add comment for documentation
COMMENT ON FUNCTION public.is_admin IS 'Securely checks if a user has admin role. Uses user_roles table only - no hardcoded emails.';