CREATE TABLE public.telegram_media_groups (
  media_group_id text PRIMARY KEY,
  chat_id text NOT NULL,
  processing_started timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_media_groups TO service_role;
ALTER TABLE public.telegram_media_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.telegram_media_buffer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_group_id text NOT NULL,
  chat_id text NOT NULL,
  file_id text NOT NULL,
  caption text,
  message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_telegram_media_buffer_group ON public.telegram_media_buffer (media_group_id);
GRANT ALL ON public.telegram_media_buffer TO service_role;
ALTER TABLE public.telegram_media_buffer ENABLE ROW LEVEL SECURITY;