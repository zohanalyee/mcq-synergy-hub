
-- Create study_audio_tracks table
CREATE TABLE public.study_audio_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ambient',
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_audio_tracks ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tracks
CREATE POLICY "Anyone can view active study audio tracks"
  ON public.study_audio_tracks
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all tracks
CREATE POLICY "Admins can manage study audio tracks"
  ON public.study_audio_tracks
  FOR ALL
  USING (is_admin());

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('study-sounds', 'study-sounds', true, 20971520, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']);

-- Storage policies: admins can upload
CREATE POLICY "Admins can upload study sounds"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'study-sounds' AND is_admin());

-- Anyone can read study sounds
CREATE POLICY "Anyone can read study sounds"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'study-sounds');

-- Admins can delete study sounds
CREATE POLICY "Admins can delete study sounds"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'study-sounds' AND is_admin());
