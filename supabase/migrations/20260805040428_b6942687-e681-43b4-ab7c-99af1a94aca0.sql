-- 1) Owner-scoped document search
CREATE OR REPLACE FUNCTION public.match_document_sections(
  query_embedding text,
  match_threshold double precision DEFAULT 0.7,
  match_count integer DEFAULT 5,
  filter_document_id uuid DEFAULT NULL::uuid,
  requesting_user_id uuid DEFAULT NULL::uuid
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
  -- Never search across the whole corpus: a caller must be identified,
  -- and results are always scoped to documents that caller owns
  -- (or everything, when that caller is an admin).
  IF requesting_user_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ds.id,
    ds.document_id,
    ds.content,
    ds.page_number,
    1 - (ds.embedding <=> query_embedding::vector) AS similarity
  FROM document_sections ds
  JOIN documents d ON d.id = ds.document_id
  WHERE
    (filter_document_id IS NULL OR ds.document_id = filter_document_id)
    AND (
      d.user_id = requesting_user_id
      OR public.has_role(requesting_user_id, 'admin'::app_role)
    )
    AND 1 - (ds.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY ds.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.match_document_sections(text, double precision, integer, uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_document_sections(text, double precision, integer, uuid, uuid) TO authenticated, service_role;

-- Remove the old 4-arg signature so no caller can bypass the owner filter
DROP FUNCTION IF EXISTS public.match_document_sections(text, double precision, integer, uuid);

-- 2) documents INSERT must be self-attributed
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON public.documents;

CREATE POLICY "Users can insert their own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR is_admin());