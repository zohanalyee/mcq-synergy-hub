# Part 1 — JSON-LD escaping warning: diagnosis

## What it is

Not a brand-new issue and not a full miss — it is a **leftover spot from the Batch-2 XSS fix**. The `safeJsonLd()` helper (`src/lib/jsonLd.ts`, escapes `<`, `>`, `&`, U+2028/29) is used in ~30 places, including all the pages the original finding named (JobDetailPage, ScholarshipDetailPage, OpportunityDetail). The migration missed exactly one component:

- `src/components/StructuredData.tsx` line 72-74 still renders `{JSON.stringify(schema)}` inside `<script type="application/ld+json">`.

Everything else in `src/` and the prerender script (`scripts/inject-meta.mjs`) already routes through the safe helper.

## Is it user-facing?

Yes — `StructuredData` is a public-page SEO component (Organization / WebSite / FAQ schemas). However, the schema objects it builds come from **static config plus FAQ props**, not from scraped or Telegram-sourced text, so today there is no live injection path.

## Severity

**Low.** Real-world exploitability is near zero because:

- React's JSX text child escapes `<` before it reaches the DOM (this is not `dangerouslySetInnerHTML`), and
- the data it serializes is not externally sourced.

It is worth fixing purely for consistency, so no future caller can pass scraped FAQ content into it.

## Fix (2-line change)

Import `safeJsonLd` in `src/components/StructuredData.tsx` and replace `JSON.stringify(schema)` with `safeJsonLd(schema)`. Then mark the finding fixed so the scanner stops blocking publishes.

---

# Part 2 — Facebook + Microsoft login: steps and scope

## Answers to your three questions

**1. Do you need DNS / API-key setup like Cloudflare?**
No DNS work at all. You need one thing per provider: an **App ID + App Secret** from that provider's developer console, pasted into Supabase Auth → Providers. The only URL involved is the callback URL that Supabase gives you:

```text
https://pzhvipkcssxrsxxljbbz.supabase.co/auth/v1/callback
```

**2. Config only, or code change?**
**Both.** Supabase dashboard toggle enables the provider server-side, but the sign-in screen has no buttons for them yet — today `src/services/authService.ts` only exposes `signInWithGoogle()` and `src/pages/SignIn.tsx` renders a single Google button. So: config by you, buttons by me.

**3. Yes, you must register an app in each console.** Exact steps below.

## Facebook — console steps (you do this)

1. Go to `developers.facebook.com` → Log in → **My Apps** → **Create App**.
2. Use case: **Authenticate and request data from users with Facebook Login** → app type **Consumer** → name it `MCQsAI`.
3. In the app dashboard: **Facebook Login → Settings** → add to *Valid OAuth Redirect URIs*:
  `https://pzhvipkcssxrsxxljbbz.supabase.co/auth/v1/callback`
4. **App settings → Basic** → copy **App ID** and **App Secret**; also fill Privacy Policy URL (`https://mcqsai.com/privacy-policy`) and Terms URL (`https://mcqsai.com/terms-of-service`) — Facebook requires these before going live.
5. Add permissions `email` and `public_profile` (default), then flip the app from **Development** to **Live** (top toggle). While in Development mode only listed testers can log in.
6. Paste App ID + Secret into Supabase → Authentication → Providers → **Facebook** → Enable → Save.

Note: Facebook returns email only if the user's account has a verified email; some users may land without one, so onboarding must tolerate a missing email.

## Microsoft (Azure) — console steps (you do this)

1. Go to `portal.azure.com` → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Name `MCQsAI`. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts** (this allows both school/office and personal outlook.com accounts).
3. Redirect URI: platform **Web**, value
  `https://pzhvipkcssxrsxxljbbz.supabase.co/auth/v1/callback` → Register.
4. Copy **Application (client) ID** from the Overview page.
5. **Certificates & secrets → New client secret** (choose 24 months) → copy the **Value** immediately (shown once).
6. **API permissions** → confirm `User.Read`, `email`, `openid`, `profile` (Microsoft Graph, delegated).
7. Paste Client ID + Secret into Supabase → Authentication → Providers → **Azure** → Enable. Leave *Azure Tenant URL* blank (or use `common`) so both personal and work accounts work.

Client secrets expire — note the expiry date; login breaks silently when it lapses.

## Code work (I do this, after providers are enabled)

- `src/services/authService.ts`: add `signInWithFacebook()` and `signInWithMicrosoft()` mirroring the existing Google helper (same `redirectTo` handling, same error shape).
- `src/pages/SignIn.tsx`: replace the single Google button with a compact social block — Google, Facebook, Microsoft — matching existing button radius/height (44px min touch target), brand tokens only, per-provider loading state, and a "Ya phir email se" divider. Same block for the sign-up tab.
- Provider icons drawn as inline SVG in a small `SocialAuthButtons` component so no new dependency and no hardcoded colors beyond the required brand marks.
- Google OAuth already redirects to `/analytics`; the new providers use the same post-login path so the existing profile-onboarding gate (mandatory 5-category profile for OAuth users) catches them. I will verify Facebook's possible missing-email case does not break `CompleteProfile`.
- Feature-safe rollout: buttons render only when the provider is turned on, driven by a small flag list, so a half-configured provider never shows a dead button.

## Order of work

1. I apply the one-line JSON-LD fix and clear the scanner finding.
2. You register both apps and enable them in Supabase (steps above); send me a "done" when each is live.
3. I ship the buttons + service helpers, typecheck, and we test one real login per provider before the banner launch.

&nbsp;

Approved — 2-line-fix kar-dein, aur scanner-warning-clear-kar-dein.

We are integrating Facebook Login for our web application (MCQsAI) and need to make the application compliant with Meta's User Data Deletion requirements.

Please implement a complete "Delete Account" feature.

Requirements:

1. Add an "Account Settings" page for authenticated users.

2. Include a "Delete Account" section with a clearly visible "Delete My Account" button.

3. Before deletion, display a confirmation dialog explaining that:

   - The action is permanent.

   - The user's account, profile, and personal data will be permanently deleted.

   - This action cannot be undone.

4. Require the user to confirm before proceeding.

5. After confirmation:

   - Delete the user's authentication account from Supabase Auth.

   - Delete all related records from our database (profiles and any user-owned data).

   - Sign the user out.

   - Redirect them to the homepage.

   - Display a success message confirming that the account has been deleted.

6. If direct deletion of the authenticated user requires a secure backend operation, implement a Supabase Edge Function or secure server-side endpoint using the Service Role Key. Never expose the Service Role Key on the frontend.

7. Add proper error handling and user-friendly messages if deletion fails.

8. Create a public page at:

   [https://mcqsai.com/delete-account](https://mcqsai.com/delete-account)

This page should explain:

- How users can delete their account from within the application.

- If they no longer have access to their account, they can request deletion by emailing:

  [zohaibalichanna@gmail.com](mailto:zohaibalichanna@gmail.com)

- The expected deletion processing time.

9. Ensure the implementation complies with Meta (Facebook Login) User Data Deletion requirements and follows Supabase security best practices.

10. Use our existing UI/UX design system so the feature matches the rest of the application.

&nbsp;

1. Pehle JSON-LD-fix (turant, main-approve-kar-raha-hoon).

2. Main-Facebook ka logo add karden wahan pe just delete account url dena hai m ne batya hai detail m (upar-diye-steps-follow-karke), phir-"done"-bolunga.

3. Aap-tab-buttons-add-kar-dein aur-hum-har-provider-ka-1-real-login-test-karenge banner-launch-se-pehle.