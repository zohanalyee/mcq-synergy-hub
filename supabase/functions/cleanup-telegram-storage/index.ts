// One-off maintenance function: removes leftover files under the `telegram/` prefix
// in the opportunity-images bucket. Deleted immediately after it runs.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: files, error: listErr } = await supabase.storage
    .from('opportunity-images')
    .list('telegram', { limit: 1000 });

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });
  }

  const paths = (files ?? []).map((f) => `telegram/${f.name}`);
  if (paths.length === 0) {
    return new Response(JSON.stringify({ deleted: 0, paths: [] }));
  }

  const { error: delErr } = await supabase.storage.from('opportunity-images').remove(paths);
  if (delErr) {
    return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ deleted: paths.length, paths }));
});
