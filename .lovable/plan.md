# Two audits — 18 Oct 2026 (report only, nothing changed)

"Verified" means I checked it today on the live site, in the code or in the database. "Not measured" means I did not test it.

---

## Part A — Site health audit

1. **Freshness.** Sitemaps (`scripts/generate-sitemaps.mjs`) and the pre-built pages (`scripts/inject-meta.mjs`) are only rebuilt when you publish. A job, announcement or blog post added in admin opens fine for visitors right away. Google sees only the general starting page and no sitemap entry until the next publish. IndexNow still alerts Bing within 15 minutes. Options:
   - Publish by hand daily. No cost.
   - Serve the jobs and blog sitemaps live from the existing `generate-sitemap` function. Low cost, medium risk: it must use the same expiry and quality rules.
   - Scheduled publishing does not exist on Lovable.
2. **Backups and alerts.** Backup status can't be seen from here; check it in Cloud settings. 8 scheduled jobs are running (IndexNow, mock-test queue, auto-fill, quality gate, stats, duplicate scan and merge, streak emails). **No failure or stuck-queue alerts exist.** The paid AI cap is 500 a day in `system_settings`. Its own note says to lower it to 300 after 21 Sep, which has not been done. `QuotaMonitor.tsx` shows the 1,400 total quota.
3. **Security.** There are **no ERROR-level warnings**. The 126 are:
   - 57 database functions anyone can run without signing in.
   - 68 functions any signed-in user can run.
   - Leaked-password protection is off. This is a one-switch fix.

   Most of the public functions are meant to be public. The admin-only ones need a one-by-one review (medium effort).
4. **Analytics.** Active: Clarity, GA4, OneSignal (live site only) and Lovable hosting analytics. Events that exist: sign_up, test_completion, scroll, user_engagement, empty_topic_view, campaign events, and announcement events. **Missing:** test_start, result_share, whatsapp_click, notification_optin, guest_to_signup.
5. **UX.**
   - Guests can try tests (15-question demo).
   - Progress is saved on the device (`useExamPersistence.ts`). Not confirmed for every test type, or for a network drop during submit.
   - **There is no WhatsApp "share my result" button.**
   - An app manifest exists, but there is no install prompt.
   - Every pre-built page has its own title. The WhatsApp preview image is a category banner, not one image per page.
6. **Hubs.** These exist: `/exams`, STS, STHP, NTHP, MDCAT, ECAT, NTS, FPSC, PPSC, CSS, PMS, university guides and forces pages. **Missing:** police, judiciary/High Court and a medical entry tests hub. There are 95 mock tests, and all 95 have syllabus data.
7. **Trust pages.** About, Contact, Privacy, Terms and Editorial Policy all exist.
8. **Bing / IndexNow.** IndexNow is live (key file plus 2 functions, every 15 min). There is no Bing Webmaster verification in the code.

---

## Part B — Mobile speed audit

### Verified live facts (checked from Europe, so Pakistan timings will be slower)
- **Cloudflare is in front of the site**, which is hosted by Lovable.
- www to the bare domain is **1 redirect hop**, about 0.14 s.
- The HTML is **not cached by Cloudflare** ("DYNAMIC", "no-cache"). Every visit goes back to the Lovable server.
- HTTP/3 is on.
- Cloudflare **Email Obfuscation** is adding its own script to every page.
- The home page HTML is 134 KB (pre-built content included).
- Before anything appears, the browser downloads the main style file of **260 KB (36 KB compressed)**, which blocks the first paint.
- It also downloads **8 code files of about 1 MB (about 297 KB compressed)**: the screen-parts library 441 KB, Header 159 KB, data library 140 KB, animation library 127 KB, App 87 KB, other files 57 KB.
- `src/main.tsx` uses `createRoot`, not `hydrateRoot`. React **throws away the pre-built HTML and draws the whole page again** after the code loads.

### Why the first paint is slow on mobile, and why Speed Index is 7.9 s while TBT is 0
- The first paint waits for the HTML from an uncached server, then for the 260 KB style file and the Google Fonts style file, over a slow phone connection. That produces 4.2 s FCP.
- After that, about 300 KB of code downloads. React then removes the pre-built page and draws it again, and the animations start. The screen keeps changing visually for seconds, which is what Speed Index measures.
- TBT is 0 because the work is spread across several smaller tasks. The waiting is mostly downloading, not the processor being blocked.
- Field INP of 779 ms comes from real low-end phones, where re-drawing the page and loading outside scripts happens while people tap.

### 1. TTFB (3.2 s in field data)
The main suspect is that the HTML is not cached at Cloudflare, so each Pakistani visitor waits for the far-away server. This is likely made worse by Cloudflare bot or challenge checks.

The code is not the cause: there is no service worker for pages, and `public/_headers` only covers files (and Lovable ignores it).

**Check in Cloudflare (your side):**
- A Cache Rule for HTML ("Cache Everything", edge cache 5–10 min, bypass for `/admin`, `/auth`, `/dashboard`).
- Bot Fight Mode or Security Level: no challenge for normal visitors.
- Rocket Loader **off**, since it breaks React and the outside scripts.
- Email Obfuscation **off**.
- Polish/Mirage are not needed.
- Brotli and HTTP/3 on.
- Optionally Tiered Cache or Argo.

### 2. LCP per page
- `/`: the main headline or hero block. It needs the HTML, the 260 KB style file and fonts. It is then redrawn after the code loads.
- `/exams/sts` and the board topic page: the H1 or the first text block, with the same chain. These pages have larger HTML: STS has about 3,500 words.
- Mock test page: the title block. There is extra loading for the mock-test page's own code file and its data fetch before the client draw.
- Per-page sizes for the last three pages were **not measured** in this pass. Only the shared files above were measured.

### 3. Outside scripts (verified in `index.html`)
All of them load after the first interaction, or after a timer as a fallback:
- AdSense: 6 s.
- Clarity: 12 s.
- GA4: 12 s.
- OneSignal: 15 s, live site only.
- Cloudflare Email Obfuscation script: immediate.
- Lovable `flock.js` and `events.js`: deferred.

None of them block the first paint. But AdSense and the others **load on the first tap**, which hurts INP. This is the main INP suspect, together with the page being drawn again.

### 4. INP
Likely heavy work on tap:
- The first tap triggers the outside scripts above.
- The animation library on the home page and in the Header.
- Mock-test option clicks run saving to the device and progress calculations. Not profiled.
- Long lists: the STS hub has 205 links and board topic pages show all their questions at once.

Not profiled today. It needs a recording on a low-end phone profile.

### 5. Pre-built pages and redrawing
- Yes, there is double work. The pre-built HTML paints first, then `createRoot` replaces it.
- Fonts: `display=swap` is set, the font file loads without blocking, and preconnect is in place. No font file is preloaded.
- Images: very few on the home page. Lazy-loading and image sizes were not audited per page.

### Smallest fixes, ranked
| # | Fix | Side | Expected gain | Effort | Risk |
|---|---|---|---|---|---|
| 1 | Cache HTML at Cloudflare for public pages | Cloudflare (you) | Large drop in TTFB/FCP in Pakistan | Small | Medium (must bypass signed-in pages; publish needs a cache purge) |
| 2 | Turn off Email Obfuscation and Rocket Loader; check bot challenges | Cloudflare (you) | Small to medium | Tiny | Low |
| 3 | Load AdSense, Clarity and OneSignal after idle time, not on the first tap | Code | Large INP gain | Small | Low |
| 4 | Keep the pre-built page instead of redrawing it (switch to `hydrateRoot`) | Code | Large Speed Index and INP gain | Medium | Medium (any difference between the pre-built and live page shows warnings) |
| 5 | Inline the styles needed for the first screen and load the rest later | Code | FCP gain | Medium | Low–medium |
| 6 | Take the animation library out of the Header and first screen; split the screen-parts library | Code | Less code at startup | Medium | Low |
| 7 | Remove the www redirect hop from shared links (use the bare domain everywhere) | Content | Small | Tiny | None |
| 8 | Measure per-page code size and phone tap delay before and after each step | Code | Proof | Small | None |

### Overall priority (both audits)
1. Cloudflare HTML cache and settings. Your side, small effort.
2. Leaked-password switch and paid AI cap. Tiny effort.
3. Load outside scripts after idle time. Small effort.
4. Missing GA4 events and WhatsApp result share. Small effort.
5. `hydrateRoot` switch and first-screen styles. Medium effort.
6. Failure alerts. Medium effort.
7. Security function review. Medium effort.
8. Live jobs and blog sitemaps. Medium effort.
9. Police and judiciary hubs. Medium effort.

### Open questions
- Can you share Cloudflare screenshots of your Caching, Security/Bots and Speed settings?
- Should the paid AI cap now be 300?
- Live sitemaps, or daily publishing?
