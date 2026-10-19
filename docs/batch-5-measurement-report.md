# Batch 5 — measurement and growth hooks

Nothing was published. Existing tracking IDs, routes, hydration, stylesheet files, sitemap files and question-generation logic were not changed.

## Events and where they fire

| Event | Trigger | Files | Parameters |
|---|---|---|---|
| `test_start` | A question-bearing test/quiz session has loaded | `src/hooks/useTestGrowth.ts`, used in `src/pages/TestSession.tsx` and `src/pages/QuizPlayer.tsx` | `test_slug`, `exam_category` |
| `test_abandon` | Unfinished attempt: pagehide, tab becomes hidden, or SPA navigation unmounts the player | Same hook | Same public metadata; no session ID |
| `result_share` | WhatsApp result link clicked; existing native/clipboard share succeeds | `src/components/WhatsAppResultShare.tsx`, `src/pages/TestSession.tsx` | `method`: whatsapp/native/clipboard |
| `whatsapp_join_click` | Join Alerts, existing channel callout, floating link or footer social link clicked | `JoinAlertsLink.tsx`, `WhatsAppChannelCTA.tsx`, `WhatsAppFloatingButton.tsx`, `Footer.tsx` | `placement`: sthp/nthp/sts/footer/channel_cta/floating/footer_social |
| `notification_optin` | OneSignal subscription changes from not opted-in to opted-in | `index.html` | None; never sends tokens or subscription IDs |
| `guest_to_signup` | A successful new email signup after a guest attempt; or a new Google/Facebook account created after that attempt | `src/services/authService.ts`, `src/contexts/AuthContext.tsx`, `src/lib/growthEvents.ts` | None |

Abandonment means an inactive episode, not proof that a learner permanently quit. Visibility can indicate a temporary tab switch. Visibility and pagehide are deduplicated until the learner resumes. Finished tests do not emit abandon. Reloaded sessions can emit a new start; there is no analytics identifier persisted per attempt.

Guest conversion uses a browser-session marker expiring after 24 hours. Returning-user OAuth logins are excluded. Email tracking requires a nonempty returned identity list; this avoids treating an existing-account response as a new signup.

Public job-test metadata is resolved against `job_tests`, using the existing public slug helper. NTHP resolves to category `nthp`, not `sts`. Generic sessions use `quiz` or `practice` without logging their custom session name. No stable public source page means the WhatsApp result button stays hidden rather than sharing a private session URL.

### Buffering and limitations

`src/utils/analytics.ts` preserves the immediate gtag stub and also queues an Arguments object into `window.dataLayer` if that stub is unavailable. Thus library-not-loaded events remain queued in the page. Browser termination before the library loads can still lose that in-memory queue; this is not durable delivery, and blockers/consent can also prevent GA4 delivery. No unload-triggered script loading was added.

## Loader delays

`index.html`: GA4 12 → **4 seconds**; Clarity 12 → **10 seconds**, both after window load plus browser idle. AdSense remains **6 seconds**, OneSignal **15 seconds**. Each keeps the bounded timer fallback and no input-triggered download. Comments state that short visits were being missed.

17 automated checks passed across `scripts/startup-loaders.test.mjs` and `src/lib/growthRules.test.mjs`, including delays/fallbacks, opt-in privacy, empty channel, result URL and lifecycle deduplication.

## Join Alerts setting

- Key: `system_settings.whatsapp_channel_url`, with a JSON string value, for example an HTTPS `whatsapp.com/channel/...` URL.
- Set it in **Admin → Social Links → Join Alerts — WhatsApp Channel URL → Save Join Alerts Link**.
- Current value: absent. Links are therefore intentionally hidden. No default URL was inserted.
- A narrow read policy was added in `supabase/migrations/20261019044532_c6106cba-3354-4250-b470-71c3cce48f6a.sql`: visitors can read this key only. Existing admin-only writes and all other settings policies remain unchanged. No data row was inserted.
- The migration introduced no linter findings. The 126 pre-existing warnings remain: 125 function-execution warnings and disabled leaked-password protection; they were not changed in this batch.
- `scripts/fetch-whatsapp-channel.mjs` refreshes `src/data/whatsappChannelSnapshot.json` before a normal publish build. A configured URL renders as a plain static `<a href="..." rel="noopener">Join Alerts</a>`. Empty values render nothing. No popup or target is added.
- Link locations: STHP/NTHP/STS introduction and global footer. Existing channel links retain their separate Social Links setting.
- Between publishes, the browser can read the latest URL; **raw prerendered HTML requires the next publish build** to refresh the snapshot. On a read failure, the previous build snapshot is retained.
- Verified the actual server renderer produces a plain anchor for a configured example and empty HTML for an empty value. This was an isolated render check, not a completed full-site prerender build.

## WhatsApp result sharing

Integrated into signed-in full-test results, quiz results and the guest result dialog. Verified by starting the real NTHP guest demo, answering all 15 questions, submitting and clicking the result link.

Observed message:

> IBA Karachi NTHP Mock Test 2027 – English & Mathematics Practice: I scored 13%. https://mcqsai.com/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice?utm_source=whatsapp

Observed queued events: one `test_start` with the NTHP public slug/category, followed by `result_share` with `method: whatsapp`; no `test_abandon` after finishing. WhatsApp navigation was intercepted during verification, so no message was sent.

Opening the actual mock-test page with `?utm_source=whatsapp` produced exactly one canonical:

`https://mcqsai.com/mock-tests/iba-karachi-nthp-mock-test-2027-english-mathematics-practice`

`src/components/seo/GlobalCanonical.tsx` was not changed.

## Report-only findings

### Report this question

No “Report this question” action exists on the tested result/review screens: `src/pages/TestSession.tsx` and `src/components/quiz/QuizResultScreen.tsx`. Flag-for-review during an exam is a bookmark, not an error report. No reporting action was added.

### `/test-session/*` indexing

- `public/robots.txt:6`: `Disallow: /test-session/*`.
- Session routes are absent from sitemap generation and prerender route lists.
- `src/pages/TestSession.tsx` has no explicit noindex head.
- Browser canonical comes from `GlobalCanonical.tsx` and uses the session pathname, query removed.
- Observed **live raw HTML** for `https://mcqsai.com/test-session/guest-audit`:

```html
<title data-rh="true">AI-Powered MCQ Practice Platform | MCQsAI</title>
<meta content="index,follow" data-rh="true" name="robots"/>
<link data-rh="true" href="https://mcqsai.com/" rel="canonical"/>
```

The local Vite raw fallback has the template title and no robots/canonical tag. The live HTML observation above is the published fallback, not new Batch 5 output.

Robots disallow does not guarantee exclusion from Google; a URL learned externally can appear without being crawled. **Smallest proposed fix, not applied:** add `noindex,follow` to TestSession through existing SEOHead, ensure fallback HTTP HTML/header supplies noindex for this path, then allow crawling so crawlers can see that noindex. A client-only tag while keeping disallow is insufficient. Do not include session URLs in any sitemap.

## GA4 Realtime check after you publish

1. Open GA4 → Reports → Realtime. Allow analytics consent and avoid an ad blocker.
2. Start a public mock test; look for `test_start` and its public `test_slug`/`exam_category`.
3. Leave an unfinished test or switch tabs; look for `test_abandon`. Temporary tab switches count as inactivity.
4. Finish and click “Share my result on WhatsApp”; look for `result_share`, `method: whatsapp`.
5. Set the channel URL and click each Join Alerts link; look for `whatsapp_join_click` and placement.
6. On the live domain, accept an actual new OneSignal subscription; look for `notification_optin`.
7. Complete a guest attempt, then create a genuinely new account; look for `guest_to_signup`. Existing-user login should not fire it.
8. Register event-scoped custom dimensions if you need slug/category/placement/method in standard GA4 reports. Realtime ingestion was not independently checked in the GA4 property.

Actual hosted signup and push permission acceptance were not exercised; signup helper deduplication and OneSignal listener behavior were checked without creating an account or granting browser permissions.

## Changed files

- `index.html`, `scripts/startup-loaders.test.mjs`
- `src/utils/analytics.ts`, `src/lib/growthEvents.ts`, `src/lib/growthRules.js`, `.d.ts`, `.test.mjs`
- `src/hooks/useTestGrowth.ts`, `src/hooks/useWhatsAppChannel.ts`
- `src/components/JoinAlertsLink.tsx`, `src/components/WhatsAppResultShare.tsx`
- `src/components/admin/SocialLinksManager.tsx`
- `src/components/Footer.tsx`, `src/components/WhatsAppChannelCTA.tsx`, `src/components/WhatsAppFloatingButton.tsx`
- `src/pages/exams/AdmissionTestPage.tsx`, `NthpGuide.tsx`, `StsHub.tsx`
- `src/pages/TestSession.tsx`, `src/pages/QuizPlayer.tsx`
- `src/components/quiz/QuizResultScreen.tsx`, `GuestResultGate.tsx`
- `src/services/authService.ts`, `src/contexts/AuthContext.tsx`
- `scripts/fetch-whatsapp-channel.mjs`, `src/data/whatsappChannelSnapshot.json`, `package.json`
- The narrow migration named above; generated Supabase types may be refreshed by migration tooling.
- Project records: `AGENTS.md`, `roadmap.md`, this report and persistent requirements.

## Build status and undo

Preview build logs report **build OK**. **A full prerender pass count is not available** in this turn; no manual full build was run, avoiding automatic sitemap refresh. No sitemap-generation script or sitemap file was intentionally edited. No performance improvement or live GA4 receipt is claimed.

Undo by restoring the pre-Batch-5 Lovable version. That does not automatically reverse the database policy: remove only `Public can read Join Alerts channel URL` through a migration if rolling back the feature. Do not revoke general table grants without checking existing policies. Loader-only undo: restore GA4/Clarity delays to 12/12 seconds and matching timing tests; keep the idle-only scheduler.

### Speed Batch 1 carry-forward

The AdSense integration is real, not just a placeholder: `src/config/ads.ts` has four configured slot IDs (board topic, blog post, test results and hub), with one-unit-per-page intent. Preview does not serve units. Configured IDs do not prove Google filled or paid for an ad; live serving was not confirmed. The above-the-fold Inter woff2 preload and display=swap remain. No hydration, stylesheet or route changes were made.