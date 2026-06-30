-- Cross-subject duplicate detection: a normalized-text SHA-256 fingerprint on
-- content_items, matching the client fingerprint scheme used in
-- aiCoachService.fingerprintQuestion (sha256 of lowercased, alphanumeric-only,
-- whitespace-collapsed title). Lets the selection layer exclude text-twins that
-- live under different ids / subjects (e.g. "synonym of Diligent" duplicated
-- across IQ, Vocabulary and CSS subjects).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.content_items
  ADD COLUMN IF NOT EXISTS content_fingerprint text;

-- Shared normalization + hashing helper (mirrors the JS normalizeText()).
CREATE OR REPLACE FUNCTION public.compute_content_fingerprint(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'extensions'
AS $$
  SELECT CASE
    WHEN p_text IS NULL THEN NULL
    WHEN btrim(regexp_replace(lower(p_text), '[^a-z0-9]+', ' ', 'g')) = '' THEN NULL
    ELSE encode(
      digest(btrim(regexp_replace(lower(p_text), '[^a-z0-9]+', ' ', 'g')), 'sha256'),
      'hex'
    )
  END;
$$;

-- Keep the column current on insert/update of the title.
CREATE OR REPLACE FUNCTION public.set_content_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.content_fingerprint := public.compute_content_fingerprint(NEW.title);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_content_fingerprint ON public.content_items;
CREATE TRIGGER trg_set_content_fingerprint
  BEFORE INSERT OR UPDATE OF title ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION public.set_content_fingerprint();

-- One-time backfill of existing rows.
UPDATE public.content_items
SET content_fingerprint = public.compute_content_fingerprint(title)
WHERE content_fingerprint IS NULL;

-- Index to make fingerprint exclusion (.not in / = ANY) cheap.
CREATE INDEX IF NOT EXISTS idx_content_items_fingerprint
  ON public.content_items (content_fingerprint);