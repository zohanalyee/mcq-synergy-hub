## Investigation result: edge function is NOT crashing

I tested all 7 sub-sitemap endpoints directly against the Supabase Edge Function. **Every one returned HTTP 200 with valid XML.**

| Endpoint | Status | Result |
|---|---|---|
| `?type=static` | 200 | 20 URLs |
| `?type=jobs` | 200 | Hundreds of `/opportunity/<slug>-<uuid>` URLs |
| `?type=scholarships` | 200 | 11+ URLs |
| `?type=blog` | 200 | 5 published posts |
| `?type=exams` | 200 | 6 exam landing pages |
| `?type=tools` | 200 | 60+ tool pages |
| `?type=boards&page=1` | 200 | 1000 board/topic URLs |

Sample working response from `?type=jobs`:
```xml
<url><loc>https://mcqsai.com/opportunity/assistant-director-fia-88b53ed6-...</loc>
     <lastmod>2025-12-24</lastmod>...</url>
```

Recent edge function logs show no errors. The function code already matches what the user's diagnosis recommends: it uses correct table names (`content_items`, `external_opportunities`, `blog_posts`), defines `generateSlugUrl`, and returns proper `Content-Type: application/xml` headers.

## Most likely explanation for the user's error

The `SUPABASE_EDGE_RUNTIME_ERROR / Service is temporarily unavailable` response is a **transient Supabase platform error** (cold start, regional blip, or rate limit), not a code bug. It is gone now — direct calls work cleanly.

It's also possible the user tested while a deploy was in flight after the previous changes.

## Recommended action: NO code changes needed

Instead, do these verification steps:

1. **Re-test the failing URLs from a browser right now** — they should all return XML.
   - https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=jobs
   - https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=scholarships
   - https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=blog

2. **Re-submit `https://mcqsai.com/sitemap.xml` in Google Search Console.** Google retries automatically; the original transient error won't permanently block indexing.

3. **Optional resilience improvements** (only if you want belt-and-suspenders against future cold-start blips). I can add:
   - A 5-minute in-memory cache on each sitemap response (`Cache-Control: public, max-age=300, s-maxage=3600`) — currently no `Cache-Control` header is set, which means Google re-hits the function cold every time.
   - An explicit try/catch around each per-type branch so one failing query degrades to an empty `<urlset>` instead of a 500.
   - A health-check log line at the top of the handler so future "is it crashing?" questions are answerable from logs in one click.

## What I will do on approval

Only the **optional resilience improvements** above (single file edit: `supabase/functions/generate-sitemap/index.ts`):
- Add `Cache-Control: public, max-age=300, s-maxage=3600` to the response headers.
- Wrap each `type` branch in its own try/catch so a single bad query returns an empty valid sitemap instead of 500.
- Add a `console.log` at handler entry with the requested type for easier log filtering.

No DB changes. No new tables. No table-name swaps (the user's prompt suggested `opportunities` table — that table does **not exist**; the correct tables `content_items` + `external_opportunities` are already used).

If you'd rather I do nothing and just re-confirm the function is healthy, say so — the function is genuinely fine right now.