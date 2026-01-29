-- Drop the existing HNSW index (must be done before altering column type)
DROP INDEX IF EXISTS document_sections_embedding_idx;

-- Alter the embedding column from 1536 to 768 dimensions for Gemini
ALTER TABLE public.document_sections 
ALTER COLUMN embedding TYPE extensions.vector(768);

-- Recreate the HNSW index for 768-dimension vectors
CREATE INDEX ON public.document_sections 
USING hnsw (embedding extensions.vector_cosine_ops);

-- Update the match_document_sections function for 768-dimension vectors
CREATE OR REPLACE FUNCTION public.match_document_sections(
  query_embedding extensions.vector(768),
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