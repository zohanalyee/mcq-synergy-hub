## Problem

Our `public/sitemap.xml` index points `<loc>` directly at `https://pzhvipkcssxrsxxljbbz.supabase.co/functions/v1/generate-sitemap?type=...`. Google requires sitemap URLs to live on the **same verified domain** as the sitemap itself, otherwise it silently rejects them — exactly what GSC is showing ("0 discovered pages", redirect-error validation failures).

## Constraint

Lovable hosting is purely static — there is **no Vite middleware, no `_redirects`, no Next.js, no edge-rewrite layer** we can use to transparently proxy `mcqsai.com/sitemaps/*.xml` → Supabase Edge Function. The previous attempt to redirect via inline JS in `index.html` is exactly what Google flagged as "Page with redirect".

The only way to ship same-origin sitemap XML on Lovable hosting is to **generate the files at build time** and serve them as real static files from `public/`.

## Solution: Build-time static sitemap generation

Replace the runtime Supabase-served sitemaps with a Node script that runs during `npm run build`, hits the database via the Supabase JS client (anon key), and writes finished XML files into `public/sitemaps/` and `public/sitemap.xml`. After build, every sitemap URL Google sees is `https://mcqsai.com/...`.

### Files to add / change

1. **`scripts/generate-sitemaps.mjs`** (new)
   - Connects to Supabase using `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env`).
   - Mirrors the logic currently in `supabase/functions/generate-sitemap/index.ts`:
     - Static pages list → `public/sitemaps/static.xml`
     - Tools list → `public/sitemaps/tools.xml`
     - Exam slugs → `public/sitemaps/exams.xml`
     - `content_items` + `external_opportunities` (jobs) → `public/sitemaps/jobs.xml`
     - Same for scholarships → `public/sitemaps/scholarships.xml`
     - `blog_posts` → `public/sitemaps/blog.xml`
     - `topics` joined to subjects/levels/systems → paginated `public/sitemaps/boards-{n}.xml` (1000 URLs each)
   - Writes a master `public/sitemap.xml` index whose `<loc>` entries are all `https://mcqsai.com/sitemaps/*.xml`.
   - Fails gracefully (warns, keeps existing files) if DB is unreachable so builds don't break.

2. **`package.json`**
   - Add `"prebuild": "node scripts/generate-sitemaps.mjs && node scripts/verify-sitemap.mjs pre"`.
   - Keeps the existing post-build verifier.

3. **`scripts/verify-sitemap.mjs`** (update)
   - Update `REQUIRED` array to expect same-origin URLs (`/sitemaps/static.xml`, `/sitemaps/jobs.xml`, etc.) instead of the Supabase function URL substrings.
   - Also assert at least one `boards-*.xml` entry exists.

4. **`public/sitemap.xml`** (overwrite)
   - Becomes a same-origin sitemap index:
     ```xml
     <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
       <sitemap><loc>https://mcqsai.com/sitemaps/static.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/tools.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/exams.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/jobs.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/scholarships.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/blog.xml</loc></sitemap>
       <sitemap><loc>https://mcqsai.com/sitemaps/boards-1.xml</loc></sitemap>
     </sitemapindex>
     ```
   - The build script will overwrite this with the live, lastmod-stamped version each deploy.

5. **`public/_redirects`** (update)
   - Remove the cross-domain `/sitemaps/*.xml → supabase.co` rules (they were Netlify-only and not honored anyway, but they're misleading).
   - Keep the SPA fallback line for portability comment.

6. **`index.html`** (update)
   - Remove the inline `<script>` that redirects `/sitemaps/*` to the Supabase function. This is the "Page with redirect" GSC error source. Static files at those paths will now serve directly, no JS needed.

7. **`supabase/functions/generate-sitemap/index.ts`** (keep, optional)
   - Leave the edge function in place as a fallback / on-demand generator, but it will no longer be referenced by `sitemap.xml`. No code change required, or we can delete it later.

8. **`public/robots.txt`**
   - Already correct (`Sitemap: https://mcqsai.com/sitemap.xml`). No change.

### Flow after change

```text
Googlebot → https://mcqsai.com/sitemap.xml          (static file, same origin)
         → https://mcqsai.com/sitemaps/static.xml   (static file, same origin)
         → https://mcqsai.com/sitemaps/jobs.xml     (static file, same origin)
         → ...all listed URLs are mcqsai.com pages, no redirects, no cross-domain
```

### Trade-offs (acknowledged)

- Sitemaps refresh **only on each deploy**, not in real time. For an exam-prep site where new jobs/scholarships appear daily, this is acceptable — Lovable rebuilds on each Lovable edit/publish, and we can also manually trigger a rebuild. If true hourly freshness is later needed, a cron-driven GitHub Action or scheduled Supabase function pushing into the repo could be added.
- Build time grows by a few seconds for the DB queries.

### Validation after deploy

1. `curl -I https://mcqsai.com/sitemap.xml` → 200, `content-type: application/xml`, no redirect.
2. `curl https://mcqsai.com/sitemaps/jobs.xml` → valid XML, every `<loc>` starts with `https://mcqsai.com/`.
3. In GSC: resubmit `https://mcqsai.com/sitemap.xml`, confirm "Discovered URLs > 0" within 1–2 days.
4. The "Page with redirect" failures (`http://mcqsai.com/`, `http://www.mcqsai.com/`, `https://mcqsai.com/tools?lang=ur`) are a **separate issue** from sitemaps — they're caused by canonicalization (HTTP→HTTPS, `?lang=` query). I'll flag them but not bundle them into this fix unless you want me to address those next.
