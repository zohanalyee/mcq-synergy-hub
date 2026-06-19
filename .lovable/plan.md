# Secure `user_feedback` (Reviews) — Security Hardening Plan

## Audit findings

**Public testimonials on the homepage** (`TestimonialsSection.tsx`) read from the `reviews` table — already secure: column-scoped select + `display_publicly = true`. **No change needed there.**

**The** `/reviews` **page and** `UserSatisfactionPopup` read from `user_feedback`, which is the problem.

`user_feedback` columns: `id, user_id, stars, category, message, created_at, updated_at, status, admin_notes, user_name, user_avatar_url, is_guest`.

Current policies include:

```
"Public can view feedback reviews"  SELECT  roles: anon, authenticated  USING (true)
```

Because Postgres RLS is **row-level, not column-level**, this single policy lets any anonymous visitor run `select *` and read **every column of every row** — including `user_id` (auth linkage), `status`, and `admin_notes`. This is the flagged exposure.

There is **no** `approved`**/**`display_publicly` **column** on `user_feedback`, so today *every* feedback row is shown publicly.

## Goal

- Public visitors: see only approved reviews, and only safe columns (no `user_id`, `status`, `admin_notes`).
- Authenticated users: view/manage only their own feedback.
- Admins: full access incl. controlling approval.
- Existing visible reviews must stay visible after deploy.

## Database changes (migration)

1. **Add moderation column**
  - `ALTER TABLE public.user_feedback ADD COLUMN is_public boolean NOT NULL DEFAULT false;`
2. **Migrate existing rows** so current `/reviews` content is preserved
  - `UPDATE public.user_feedback SET is_public = true;` (backfill all current rows to visible)
3. **Remove the over-permissive policy**
  - `DROP POLICY "Public can view feedback reviews" ON public.user_feedback;`
  - This removes all `anon` direct SELECT access to the table. Authenticated/admin/insert policies remain unchanged.
4. **Expose only safe columns to the public via SECURITY DEFINER RPCs** (RLS cannot hide columns, so RPCs are the correct least-privilege mechanism):
  - `get_public_feedback_reviews(filter_rating int, sort_by text)` → returns `id, user_name, user_avatar_url, stars, message, category, created_at, is_guest` **WHERE** `is_public = true`. Never returns `user_id`, `status`, or `admin_notes`.
  - `get_public_feedback_stats()` → returns the aggregate star counts (`avg_rating`, `total_reviews`, `five_star`…`one_star`) over `is_public = true` rows.
  - Both `SECURITY DEFINER`, `SET search_path = public`, `GRANT EXECUTE ... TO anon, authenticated`.

Resulting policy set on `user_feedback`:

- Admins view all (`is_admin()`) — kept
- Admins update (incl. toggling `is_public`) — kept
- Users view own (`auth.uid() = user_id`) — kept
- Authenticated insert own / Guest insert — kept
- **No** `anon` **direct SELECT** — public reads go through the RPCs only

## Frontend changes

- `src/pages/Reviews.tsx`
  - Replace the direct `from('user_feedback').select('stars')` stats query with `supabase.rpc('get_public_feedback_stats')`.
  - Replace the direct `from('user_feedback').select('id, user_name, …')` reviews query with `supabase.rpc('get_public_feedback_reviews', { filter_rating, sort_by })`.
  - The realtime subscription on `user_feedback` will no longer fire for anon (no SELECT policy); the page still loads fine. Keep it for signed-in/admin sessions, or drop it — behavior of the page is unaffected. (No UI/markup changes.)
- `src/pages/Feedback.tsx` — submission insert unchanged (still inserts own row; new rows default `is_public = false` pending admin approval). No UI change.
- `src/components/UserSatisfactionPopup.tsx` — only reads the current user's own row (covered by "view own" policy) and inserts; unchanged.
- `src/components/admin/feedback/AdminFeedbackPanel.tsx` — admin already has full access; optionally surface an "approve/publish" toggle that sets `is_public` (admin-only). This is the moderation control. No change required to fix security, but recommended so admins can publish new feedback.

Note: new feedback now defaults to **not public** until an admin approves it. Existing reviews are backfilled to public so nothing currently visible disappears.

## Verification

- As `anon`: `select * from user_feedback` → permission denied; `rpc get_public_feedback_reviews` → only safe columns, only `is_public = true` rows.
- `/reviews` page loads the same reviews as before (post-backfill).
- Signed-in user sees only their own rows via direct query; admins see all.

## Answer: www → apex redirect (301 vs 302)

This redirect is **not in the app code** — there is no client-side or React Router redirect handling `www → apex`. It happens at **Lovable's hosting/edge layer** (you have `mcqsai.com` + `www.mcqsai.com` both connected, with one set as Primary; non-primary redirects to Primary). Lovable's platform issues a **301 permanent** redirect for the non-primary → primary domain consolidation, served at the edge (good for SEO signal strength) — it is not something configurable in this codebase. The 486 "Page with redirect" entries in GSC are expected during consolidation and will resolve as Google recrawls; ensure `www.mcqsai.com` is set as the non-primary and `mcqsai.com` as Primary in Project Settings → Domains (or vice-versa, consistently). No code change is needed or possible for this from the app side.

This plan is security-only; it does not alter review UI, SEO, indexing, or sitemap behavior beyond the required access changes.

&nbsp;

&nbsp;

# **Confirmed mcqsai.com is set as Primary in** Project Settings → 

Domains. No action needed on the redirect side.

&nbsp;

Approved — proceed with the security hardening plan for 

user_feedback. After deployment, confirm:

&nbsp;

1. /reviews page still shows the same reviews as before

2. Anon verification test passes (direct select denied, RPC 

   returns only safe columns)

3. New feedback submissions still work correctly

&nbsp;

&nbsp;