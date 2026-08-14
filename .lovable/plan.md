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
