# Blank / unstyled page for returning visitors: what we found and the fix

## What we checked (live site, 21 Oct 09:50 UTC)
- Page files (HTML): `cache-control: max-age=14400, must-revalidate`. That tells every phone to keep a page for **4 hours without asking the server**.
- Code and style files (`/assets/...`) that no longer exist come back as **404, plain text**. They are not the homepage served as code, and Cloudflare does not keep the 404 (BYPASS). So a broken file is never stored as a "wrong type" file.
- Service worker: only `OneSignalSDKWorker.js`, the notification worker. It loads OneSignal's push code and does not store pages or site files. The site has no other worker and no offline mode. I can't see inside your phone, so this part is likely but not proven on your device.

## Most likely cause
1. Your phone kept an old copy of the page from before the publish.
2. That old page asks for old code and style files. The new publish deleted them, so they now return 404.
3. If the style file is missing, you see plain text with blue links. If the main code file is missing, you see a blank page.
4. All our "reload once" safety code lives **inside** the main code file. If that file never loads, the safety code never runs. So Batch 8.2's recovery cannot help here. It also isn't the cause: it only kicks in after the app has started.
5. "Purge Everything" in Cloudflare clears Cloudflare's copy only, never the copy on your phone. That's why Incognito works and your normal tab doesn't.

Not proven: why repeated refresh doesn't help. A normal refresh should ask the server again. Chrome on Android may be reusing the old page from memory. We confirm this in the "Check" step below.

Does an 8.2 guard leave people stuck? Only in one narrow case: a second missing file within 30 seconds of a reload shows the error screen, not a blank page. Missing style files are not handled anywhere today.

## Who is affected
Anyone who opened the site in the 4 hours before a publish and comes back within those 4 hours. It has happened after every publish since the 4-hour setting was in place. It fixes itself when the 4 hours run out. Real numbers aren't measurable: blank visits never load analytics.

## Fix (needs your approval)
**A. Self-healing safety net in the page itself.** This is a small inline script in the page head, no new libraries. If the main code or style file fails to load, or the app hasn't started after 8 seconds, the page reloads **once** to a fresh address (`?v=<time>`). The page stays index/follow, the canonical tag stays clean, and bots and prerender are skipped. This protects visitors from now on.

**B. Cloudflare rule (you set this; it fixes people stuck right now).**
Cloudflare → mcqsai.com → Rules → Cache Rules → Create rule:
- Name: `HTML no browser cache`
- When: URI Path does **not** start with `/assets/` AND does not end with `.js`, `.css`, `.woff2`, `.png`, `.svg`, `.pdf`, `.xml`, `.txt`
- Then: Browser TTL → **Override origin** → `0` (always revalidate). Edge TTL → **5 minutes** (keeps Google and visitors fast).
- Keep `/assets/*` at 1 year (already correct).
Then Purge Everything once more.

**C. Old-file grace period.** Ask Lovable support whether files from the previous publish can stay available for a while after a new publish. That would remove the root cause completely.

**Rollback:** not needed. The new site works (Incognito proves it). Rolling back would delete the files again and repeat the problem.

## Check after the fix
On your phone: Chrome → ⋮ → Settings → Site settings → All sites → mcqsai.com → Clear & reset. Confirm the homepage loads. Then test once with the PDF link.

## Technical details
- `index.html`: inline `onerror` on the module script and stylesheet links, plus a `#root` empty-after-8s watchdog. Uses a sessionStorage one-shot key separate from `mcqsai:chunk-reload-at` and reloads via `location.replace` with a `v` param. A test covers the one-shot rule.
- `public/_headers` gains `/*.html` and `/` with `Cache-Control: no-cache`. The host may ignore it, so the Cloudflare rule is the reliable control.
