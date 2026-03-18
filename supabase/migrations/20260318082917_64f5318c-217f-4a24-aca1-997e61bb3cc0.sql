
-- Create user_inquiries table
CREATE TABLE public.user_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_notes TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_user_inquiries_status ON public.user_inquiries(status);
CREATE INDEX idx_user_inquiries_created_at ON public.user_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit inquiry (public insert)
CREATE POLICY "Anyone can submit inquiry"
  ON public.user_inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only admins can read all inquiries
CREATE POLICY "Admins can read all inquiries"
  ON public.user_inquiries
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Only admins can update inquiries
CREATE POLICY "Admins can update inquiries"
  ON public.user_inquiries
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Only admins can delete inquiries
CREATE POLICY "Admins can delete inquiries"
  ON public.user_inquiries
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_inquiries_updated_at
  BEFORE UPDATE ON public.user_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
