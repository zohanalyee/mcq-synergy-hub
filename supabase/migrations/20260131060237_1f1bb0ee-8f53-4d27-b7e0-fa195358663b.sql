-- Drop the old vector-typed function signature
DROP FUNCTION IF EXISTS public.match_document_sections(extensions.vector, double precision, integer, uuid);

-- Ensure only the text version exists
CREATE OR REPLACE FUNCTION public.match_document_sections(
  query_embedding text,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5,
  filter_document_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  page_number integer,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.document_id,
    ds.content,
    ds.page_number,
    1 - (ds.embedding <=> query_embedding::vector) AS similarity
  FROM document_sections ds
  WHERE 
    (filter_document_id IS NULL OR ds.document_id = filter_document_id)
    AND 1 - (ds.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY ds.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$function$;