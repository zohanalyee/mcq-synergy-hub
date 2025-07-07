-- Phase 1: Fix Database RLS Policies for content_items table

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Users can update their own content" ON public.content_items;
DROP POLICY IF EXISTS "Authenticated users can create content" ON public.content_items;
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.content_items;

-- Create proper RLS policies that allow content submission
CREATE POLICY "Anyone can view approved content" 
ON public.content_items 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Authenticated users can insert content" 
ON public.content_items 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own content" 
ON public.content_items 
FOR SELECT 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can update their own content" 
ON public.content_items 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid());

-- Add admin policy for content management
CREATE POLICY "Admin can manage all content" 
ON public.content_items 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.username = 'admin@example.com'
  )
);