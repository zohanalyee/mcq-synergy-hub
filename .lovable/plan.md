## Sitemap regression fix plan

### Current finding
I checked the live URL from the server side and `https://www.mcqsai.com/sitemap.xml` is currently returning:

- HTTP `200`
- `content-type: text/xml; charset=utf-8`
- the expected 7 Supabase Edge Function sitemap URLs

So the repository file exists and the latest published URL appears healthy right now. The mobile screenshot showing the React 404 is still explainable by one of these cases:

1. The browser was viewing a stale/cached deployment during or before publishing completed.
2. The screenshot URL may have been truncated visually and could have been a nearby path like `/sitema...` rather than exactly `/sitemap.xml`.
3. A previous deployment served SPA fallback for `.xml`, but the current deployment now serves the static file correctly.
4. Legacy `/sitemaps/*.xml` paths still return 404 on Lovable hosting because `public/_redirects` is Netlify-specific and Lovable does not process it.

### What I will do after approval

1. **Re-assert the physical sitemap file**
   - Keep/rewrite `public/sitemap.xml` with the exact 7 cross-domain Supabase Edge Function URLs:
     - `type=static`
     - `type=jobs`
     - `type=scholarships`
     - `type=blog`
     - `type=exams`
     - `type=boards&page=1`
     - `type=tools`
   - Ensure the XML declaration and sitemap namespace remain valid.

2. **Add a build-time verification script**
   - Add a small script that verifies:
     - `public/sitemap.xml` exists before build.
     - the built `dist/sitemap.xml` exists after build.
     - it contains `<sitemapindex>` and all 7 required Edge Function URLs.
   - Update the build script so future builds fail if Vite does not copy the sitemap.

3. **Fix legacy `/sitemaps/*.xml` 404 risk inside the app**
   - Since Lovable hosting does not honor `public/_redirects`, the current `/sitemaps/jobs.xml` etc. paths cannot rely on that file.
   - Add a tiny pre-React browser redirect in `index.html` for legacy sitemap paths only:
     - `/sitemaps/jobs.xml` -> Supabase Edge Function `?type=jobs`
     - `/sitemaps/scholarships.xml` -> `?type=scholarships`
     - `/sitemaps/blog.xml` -> `?type=blog`
     - `/sitemaps/exams.xml` -> `?type=exams`
     - `/sitemaps/tools.xml` -> `?type=tools`
     - `/sitemaps/static.xml` -> `?type=static`
     - `/sitemaps/boards-1.xml` -> `?type=boards&page=1`
   - This prevents users/bots hitting those legacy paths from seeing the React 404 component. The canonical `sitemap.xml` will still use direct Supabase URLs, so Google does not depend on this fallback.

4. **Clean up misleading hosting config**
   - Remove or simplify sitemap rules in `public/_redirects`, because Lovable does not use them and they create false confidence.
   - Keep only harmless documentation comments or remove the file if it is not needed.

5. **Verify after implementation**
   - Run a production build locally and confirm `dist/sitemap.xml` exists.
   - Check `dist/sitemap.xml` content for the 7 required URLs.
   - Re-check live/published URL headers after publish instructions:
     - `https://www.mcqsai.com/sitemap.xml` should return XML, not React HTML.

### Technical details

- Vite automatically copies everything in `public/` to `dist/`; the verification script will make that behavior explicit and fail loudly if it regresses.
- Lovable hosting has built-in SPA fallback for app routes, but static files with real extensions should be served as assets when present.
- `public/_redirects` is not processed by Lovable hosting, so it cannot be used as the real fix for `.xml` redirects.
- Edge Function code does not need database or schema changes for this fix.