# AdSense Compliance Audit & Fix Plan

## Audit findings

All four required static pages already exist and are routed:

- `/privacy-policy` → `src/pages/legal/PrivacyPolicy.tsx`
- `/terms-of-service` → `src/pages/legal/TermsOfService.tsx`
- `/about` → `src/pages/About.tsx`
- `/contact` → `src/pages/Contact.tsx` (already has a working contact form + support email)

Gaps that would trigger AdSense rejection:

1. **Privacy Policy** lists only Google Analytics + Supabase. It has **no cookies clause and no Google AdSense / third-party advertising tracking disclosure** — required now that the AdSense script is live.
2. **Terms of Service** has a generic disclaimer but **no statement disowning affiliation with FPSC/SPSC/NTS** or other official testing agencies.
3. **Footer**: Privacy, Terms, Editorial Policy, and Contact are in the bottom bar; "About Us" only appears in the Resources column. All four are reachable, but About is not in the primary legal bar.
4. **Thin content**: `TestSession.tsx` active exam view is buttons/questions only — no descriptive text, which AdSense flags as low-value.

## Planned changes

### 1. Privacy Policy — add cookies & AdSense clause

Add a new "Cookies & Advertising" section to `PrivacyPolicy.tsx`:

- Explain cookies usage.
- Disclose Google AdSense as a third-party vendor using cookies (incl. the DoubleClick/advertising cookie) to serve ads based on prior visits.
- Link to Google's ad settings / how users can opt out.
- Add Google AdSense to the existing third-party services list.

### 2. Terms of Service — add affiliation disclaimer

Expand the Disclaimer section in `TermsOfService.tsx` with the exact required statement:

> "This is an independent educational platform and not affiliated with any official government testing agency like FPSC, SPSC, or NTS. All information is for preparation purposes only."

### 3. Footer — ensure all 4 links in the legal bar

Update `src/components/Footer.tsx` bottom bar to include **About** alongside Privacy, Terms, and Contact (keeping the existing Editorial Policy link). All four compliance pages will be clearly visible in the global footer.

### 4. Thin-content fix on test pages

Add a small contextual description block to the active exam area in `TestSession.tsx` (above the `QuestionCard`). It will render a 2–3 sentence dynamic blurb built from the current test's subject/topic name, e.g.:

> "You are practicing [Subject] multiple-choice questions designed for Pakistani competitive and board exam preparation. Each question includes the correct answer and explanation to help you learn as you go. Use this practice test to assess your knowledge and track your progress."

This guarantees real text content on the test view. A reusable `TestContextBlurb` snippet keeps it tidy.

### 5. Empty-category protection

Review nav components (`Header`, `MobileBottomNav`, `AppSidebar`). Scholarships and Jobs route to DB-backed pages with content, so they stay. No `/admissions` route exists. If any nav item is found pointing to a genuinely empty page, it will get a "Coming Soon" badge or be hidden. (No removals planned unless an empty target is confirmed during implementation.)

## Technical notes

- All edits are frontend/presentation only (legal copy, footer JSX, a text block in the test page). No schema, business-logic, or data changes.
- New copy uses existing semantic tokens (`text-foreground`, `text-muted-foreground`, `text-primary`) and existing section markup patterns.
- The test blurb derives its subject/topic from already-available `testData` / question context — no new fetches.

This AdSense Compliance Audit and Fix Plan is absolutely perfect. It hits every requirement accurately without bloating the UI.

Please proceed with the implementation exactly as outlined.

A quick note for TestSession.tsx: Make sure the new dynamic text blurb uses a muted text color (e.g., text-muted-foreground) and a slightly smaller font size (e.g., text-sm) so it satisfies the AdSense text requirement without distracting the user from their active exam questions.

Go ahead and build this!