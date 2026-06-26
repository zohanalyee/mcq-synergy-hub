# Current findings

## Live URL re-check

From my environment, `https://mcqsai.com/mock-tests/sindh-teaching-license-exam-secondary-school-teacher` still returns:

```text
HTTP/2 403
cf-mitigated: challenge
server: cloudflare
<title>Just a moment...</title>
canonical: none
```

I tested multiple user agents (`curl`, normal browser UA, Facebook, Twitterbot, Googlebot) and all still hit the Cloudflare managed challenge. So I cannot yet personally observe the homepage shell you now see. Your location may be allowed while my data-center IP is still challenged.

## Build wiring in source

`package.json` does wire `inject-meta.mjs` into the normal `build` command:

```text
prebuild: node scripts/generate-sitemaps.mjs && node scripts/verify-sitemap.mjs pre
build:    PRERENDER=true vite build && node scripts/dedupe-og.mjs && node scripts/inject-meta.mjs && node scripts/verify-prerender.mjs && node scripts/verify-sitemap.mjs post
```

So if Lovable publishing runs the project's `build` script exactly, `inject-meta.mjs` should run after Vite.

## Important limitation found

The current `inject-meta.mjs` is **not production-proof**:

- It exits successfully even if Supabase credentials are missing.
- It exits successfully even if DB-driven page injection fails.
- It exits successfully on fatal errors.
- `verify-prerender.mjs` checks that *some* `/mock-tests/` pages exist, but it does not require the exact critical route `/mock-tests/sindh-teaching-license-exam-secondary-school-teacher/index.html`.

That means a production publish can appear successful while not deploying the specific generated route HTML.

## Routing/server behavior

Lovable hosting should serve a real static file before SPA fallback. If the live URL serves the homepage shell after Cloudflare is bypassed, the most likely explanation is:

```text
dist/mock-tests/sindh-teaching-license-exam-secondary-school-teacher/index.html
is missing from the deployed artifact
```

Not that SPA fallback is incorrectly taking priority over an existing static file.

# Proposed fix

## 1. Make dynamic meta injection mandatory for SEO-critical routes

Update `scripts/inject-meta.mjs` so production builds fail if DB-driven route generation silently fails.

Specifically:

- Do not silently `process.exit(0)` when Supabase credentials are missing in production.
- Track DB generation counts for `mock-tests`, `opportunities`, `blog`, and `boards`.
- Fail the build if `mock-tests` generation returns zero pages.
- Fail the build if the specific required URL is not written:

```text
dist/mock-tests/sindh-teaching-license-exam-secondary-school-teacher/index.html
```

This converts the current hidden production failure into a visible failed publish instead of deploying the homepage shell.

## 2. Strengthen verification for exact production URLs

Update `scripts/verify-prerender.mjs` to require exact route files for high-value SEO pages, including:

```text
/mock-tests/sindh-teaching-license-exam-secondary-school-teacher
/subject-content/physics
/blog/<first published or known public sample if stable>
```

For each required route:

- File must exist in `dist/.../index.html`.
- `<title>` must not equal homepage title.
- canonical must equal the full route URL.
- description must not equal homepage description.

## 3. Add a generated manifest for auditability

Have `inject-meta.mjs` write a manifest like:

```text
dist/seo-injected-routes.json
```

Containing:

- route path
- page type
- title
- canonical
- generation timestamp

This gives us a concrete artifact to inspect in build output and makes future debugging much easier.

## 4. Avoid relying on `public/_headers`

`public/_headers` is Netlify-style and Lovable hosting does not process it. I will not depend on it for this fix. Cache behavior must be handled at Cloudflare or Lovable infrastructure level; the code fix will focus on ensuring the static files actually exist in the artifact.

## 5. Publish + live verification sequence

After implementation:

1. You publish/update the app.
2. Purge Cloudflare for the exact route or purge everything.
3. Ensure my environment is not challenged by Cloudflare, or temporarily allow verified bots / non-browser fetches.
4. I fetch the exact live URL and report:

```text
status
cf-cache-status / cf-mitigated
<title>
canonical
meta description
```

If the deployed route still returns the homepage shell after the file is guaranteed in `dist`, then the next escalation is Lovable hosting static-file precedence. But source inspection suggests the current problem is missing generated route files in the deployed artifact, not routing precedence.

# Expected outcome

The next production publish either:

- deploys with `dist/mock-tests/sindh-teaching-license-exam-secondary-school-teacher/index.html` present and page-specific metadata visible to raw HTTP fetches, or
- fails the build loudly instead of silently shipping a broken SEO artifact.

&nbsp;

# **Final confirmation: I verified via WhatsApp link preview AND Google** 

Search Console's "Test Live URL" tool — both show the correct 

page-specific title, canonical, meta description, and OG image for 

the mock test page. The fix is working correctly in production.

&nbsp;

No further action needed on this specific issue. Thank you for the 

thorough investigation — this is resolved and confirmed.