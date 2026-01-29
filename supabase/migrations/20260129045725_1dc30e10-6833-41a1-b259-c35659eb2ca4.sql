-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create storage bucket for course books (PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course_books', 'course_books', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for course_books bucket
CREATE POLICY "Anyone can view course books"
ON storage.objects FOR SELECT
USING (bucket_id = 'course_books');

CREATE POLICY "Authenticated users can upload course books"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course_books' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete course books"
ON storage.objects FOR DELETE
USING (bucket_id = 'course_books' AND public.is_admin());

-- Table: documents - stores metadata about uploaded books
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_count INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for documents
CREATE POLICY "Anyone can view documents"
ON public.documents FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update documents"
ON public.documents FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete documents"
ON public.documents FOR DELETE
USING (is_admin());

-- Table: document_sections - stores chunked text with vector embeddings
CREATE TABLE public.document_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  page_number INTEGER,
  section_index INTEGER NOT NULL DEFAULT 0,
  token_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on document_sections
ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_sections
CREATE POLICY "Anyone can view document sections"
ON public.document_sections FOR SELECT
USING (true);

CREATE POLICY "Admins can insert document sections"
ON public.document_sections FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update document sections"
ON public.document_sections FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete document sections"
ON public.document_sections FOR DELETE
USING (is_admin());

-- Create index for vector similarity search (using HNSW for better performance)
CREATE INDEX ON public.document_sections 
USING hnsw (embedding extensions.vector_cosine_ops);

-- Create index for document_id lookups
CREATE INDEX idx_document_sections_document_id 
ON public.document_sections(document_id);

-- Create trigger for updated_at on documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION public.match_document_sections(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_document_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  page_number INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.document_id,
    ds.content,
    ds.page_number,
    1 - (ds.embedding <=> query_embedding) AS similarity
  FROM document_sections ds
  WHERE 
    (filter_document_id IS NULL OR ds.document_id = filter_document_id)
    AND 1 - (ds.embedding <=> query_embedding) > match_threshold
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;