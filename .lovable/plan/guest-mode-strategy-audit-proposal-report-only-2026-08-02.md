# Guest-Mode Strategy — Audit + Proposal (report only)

Guiding rule: **content stays open (SEO/traffic), personalization stays locked (conversion)**.

## Current state (verified in code)


| Area                    | Route / file                                                                                                                          | Guest today                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Board / topic practice  | `/boards`, `BoardTopicPage.tsx` — no auth guard, prerendered MCQs                                                                     | Fully open. Correct.                                                                                  |
| Quick Test / Quiz       | `useStartQuickTest.ts`, `GuestResultGate.tsx`, `guestResultCarry.ts`                                                                  | Phase 3B behaviour: free test, 1 explanation taste, visible cap, carry-forward after signup. Correct. |
| Mock Tests (job tests)  | `/mock-tests` open; `JobTestsTab.tsx` has a full guest path (guest session, answer-free RPC, `isGuest` result gate)                   | Already almost identical to Quick Test — **no demo-size cap, no explicit "sample test" framing**.     |
| Custom Syllabus Builder | `/custom-syllabus` open; `SyllabusBuilder.tsx` — guest can browse, select, and **start a full test**; only "Save template" is gated   | Weakest gate: the whole personalization engine is free.                                               |
| AI Coach                | `/features/ai-coach` public landing; `/ai-coach` + `/dashboard` + `/analytics` behind `InstantAuthGuard`                              | Fully locked, public marketing page exists. Correct.                                                  |
| Landing / exam pages    | `/`, `/exams/*`, SEO pages — no guards; 16 `InstantAuthGuard` routes are all dashboard/profile/achievements/analytics/tools-analytics | No accidental login wall found.                                                                       |


## Proposal per feature

**1. Board/Topic pages** — no change. Keep 100% open, keep prerendered MCQs, keep guest CTA to practice.

**2. Quick Test** — no change. This is the reference pattern.

**3. Mock Tests** — align to Quick Test explicitly:

- Guest attempt allowed but capped as a **demo**: fixed smaller length (e.g. 15 questions) regardless of the requested count.
- Card/dialog labels it "Free demo attempt (15 of N questions)" so the cap is a feature, not a silent trim.
- Result screen shows score + per-question correct/incorrect, 1 explanation unlocked, rest gated by the existing `GuestResultGate`.
- Reuse `guestResultCarry` so the demo attempt lands in the DB after signup.

**4. Custom Syllabus Builder** — convert to preview-first:

- Guest can browse subjects/topics, open the topic modal, and see the live selection summary (this is the sell).
- "Start test" and "Save template" both require signup; the floating action bar shows a single clear "Sign in to run your syllabus" CTA with the selection preserved via `useAuthIntent` so nothing is lost.
- Keep the page crawlable/indexable — the gate is on the action, never on the content.

**5. AI Coach** — no change. Keep `/ai-coach` locked with no taste; keep `/features/ai-coach` as the public SEO page.

**Landing/exam pages** — confirmed open; only tidy-up is CTA wording consistency (see below).

## Additional findings (not in the original list)

- `/leaderboard` **is open to guests** but is a personalized/social surface with nothing for a guest to see. Decide: keep open as social proof (read-only) or gate it. Recommend keep open, read-only, with a "Sign in to appear on the leaderboard" nudge.
- `/ask-document` **(AI document Q&A) is fully open** — an AI-credit-consuming feature with no auth or guest cap. Highest cost risk found. Recommend: guest gets 1 preview question, then signup.
- **Tools (**`/tools/*`**) are open** per `FEATURE_CONFIG` free tier — consistent, no change; but the attendance-analytics sub-route is gated, which is the right split.
- `FEATURE_CONFIG` **in** `src/config/features.ts` **is now decorative** — real gating lives in `App.tsx` `InstantAuthGuard` calls and ad-hoc `if (!user)` checks. Recommend making `FEATURE_CONFIG` the single source of truth so guest rules stop drifting per feature.
- **CTA wording is inconsistent** across surfaces ("Start free", "Sign in to save results", "Sign in Required", "Continue as Guest"). Recommend one vocabulary: *Try free* (guest allowed) vs *Sign in to unlock* (gated).
- `GuestChoiceModal` exists with a good two-option UX but is only used on some paths; it should be the standard interstitial for every gated action.

## Suggested implementation order (future turns)

1. Mock-test guest demo cap + labelling (small, reuses existing gate).
2. Syllabus Builder preview-first gate + intent preservation.
3. `/ask-document` guest cap (cost protection).
4. `FEATURE_CONFIG` as single source of truth + CTA vocabulary sweep.
5. Leaderboard decision.

No code changes in this turn.

&nbsp;

&nbsp;

Guest-Mode-Strategy-Report acknowledge — bohot achi/thorough hai, khaas kar additional-findings (leaderboard, FEATURE_CONFIG, CTA-inconsistency) jo maine explicitly nahi maangi thi lekin zaroori thin.

&nbsp;

Proposal-per-feature (Mock-Test-demo-cap, Syllabus-Builder-preview-first, AI-Coach-no-change, Board-pages-no-change) — SAB APPROVE hain conceptually. In sab ko IMPLEMENT karenge NAYE-MAHINE/CREDITS ke sath, jaisa suggested-order mein diya hai:

1. Mock-test-demo-cap

2. Syllabus-Builder-preview-gate

3. FEATURE_CONFIG-consolidation + CTA-vocabulary-sweep

4. Leaderboard-decision (keep-open-read-only-with-nudge — yeh already-approved-hai as final-decision)

&nbsp;

LEKIN — /ask-document ek ALAG/URGENT-CASE hai, isay ABHI (is-mahine-mein-hi, baaqi-sab-pause-hone-ke-bawajood) karna hai:

&nbsp;

/ask-document ke liye IMMEDIATE, LOW-COST fix chahiye — feature ko "COMING SOON" bana dein:

1. Page accessible/visible rahe, lekin actual-functionality (upload, AI-Q&A) DISABLE ho.

2. Friendly "Coming Soon"/"Jald Aa Raha Hai" message (bilingual agar ho-sake).

3. Koi form/upload/submit-interaction na ho, ya button hi na dikhe.

4. Backend-AI-call bhi is-route-se-possible-na-ho (edge-function-guard bhi lagayen agar zaroorat ho).

&nbsp;

Yeh SABSE CHHOTA/TEZ fix hona chahiye — koi guest-cap-logic, sirf temporarily "off" karna hai. Please batayen kitna effort lagega, aur ABHI implement kar dein kyunki yeh ACTIVE-FINANCIAL-RISK hai.