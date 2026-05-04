I understand the frustration: the codebase still contains a route-level login gate on `/mock-tests`, so guests can be redirected to sign-in before the DB-only job-test path ever runs. There are also a couple of places where guest/legacy paths can still behave inconsistently. I will fix the actual regression points instead of redoing the same phase work.

Plan:

1. Remove the login gate from the job test page
  - Change `/mock-tests` in `src/App.tsx` from `InstantAuthGuard` to direct `<MockTests />`.
  - Keep analytics/profile/AI coach protected, but make recruitment/job tests browseable and playable for guests.
  - Update the route comment to reflect the intended rule: job tests are public; only progress persistence and AI-only fallback features may require sign-in.
2. Make guest job tests strictly DB-only
  - Keep the existing isolated path in `JobTestsTab`: published `job_test_definitions` + approved `job_test_questions` are used directly from the database.
  - Ensure guests never reach the legacy `generate-test` edge function from job tests.
  - If no approved DB questions exist, show the “questions are being prepared” message, not a forced login page and not an AI call.
3. Fix progress/unlock behavior for guests without breaking RLS
  - The `job-test-progress` edge function already supports guest lookup by IP using service role internally.
  - `TestSession` currently skips recording job progress for guests; I will change it to call `recordJobTestProgress` for job-test sessions for both guests and logged-in users.
  - This allows guest unlock/weak-topic progress through the edge function without client-side DB writes.
4. Fix the progress fetch bug
  - `fetchJobTestProgress()` first calls `supabase.functions.invoke("job-test-progress", { method: "GET" })` without passing `job_test_id`, which can produce a bad request before falling back.
  - I will remove that broken invoke attempt and use the explicit fetch URL with `?job_test_id=...` directly.
  - This avoids noisy failures and makes unlock caps reliable.
5. Stop subject mock tests from charging guests unexpectedly
  - In `SubjectTestsTab`, guests can currently hit the old flow and may end up calling `generate-test` if the local bank has a deficit.
  - I will make guest subject-test behavior match your rule: use available DB/bank questions only; do not call AI edge functions as guest.
  - If no bank questions exist, show a friendly “questions not available yet / sign in to generate” message without burning credits.
  - If some bank questions exist, start with those questions rather than failing or generating.
6. Improve the sign-in messaging on this path
  - Remove the route-level “Sign in to take tests” blocker for job tests.
  - Only show sign-in prompts when the user requests an authenticated-only benefit, such as AI generation, analytics, or saved coach tracking.
7. Sanity checks after implementation
  - Verify `/mock-tests` route is public.
  - Verify guest job test start creates a `guest-*` session in `sessionStorage` and navigates to `/test-session/...`.
  - Verify the DB-only path does not call `generate-test` for guests.
  - Verify logged-in users can still use progress/unlock and AI fallback where intended.

No new AI generation or credit-consuming behavior will be added for guests. The key fix is removing the remaining auth guard and tightening the fallback paths so the earlier DB-only work is actually reachable.

&nbsp;

(very important):

Ensure guest job tests always use only approved DB questions and never trigger any AI generation under any condition.”