DROP INDEX IF EXISTS public.content_items_mcq_title_unique_idx;
CREATE UNIQUE INDEX content_items_mcq_title_unique_idx
  ON public.content_items USING btree (md5(title))
  WHERE (category = 'mcq' AND status <> 'flagged_duplicate');