// TEMPORARY one-off seed: inserts the fixed, code-derived exam page facts. Idempotent (skips existing slugs). Removed after import.
import { createClient } from "npm:@supabase/supabase-js@2";
import rows from "./rows.json" with { type: "json" };
Deno.serve(async () => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { error, count } = await sb.from("exam_pages").upsert(rows, { onConflict: "slug", ignoreDuplicates: true, count: "exact" });
  return new Response(JSON.stringify({ error: error?.message ?? null, count }), { headers: { "Content-Type": "application/json" } });
});
