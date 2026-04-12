
Fix the issue at the actual data-flow level, not just the badge UI.

1. Update `src/components/mock-tests/JobTestsTab.tsx`
- Stop building `syllabusWeights` in the component.
- Pass raw `test.syllabus` into the generator as `syllabusData`.
- Save the raw syllabus into the session payload too, so later logic can use the exact breakdown.
- Keep per-subject AI triggers, but send the exact missing syllabus topic string for each deficit.

2. Refactor `src/services/testGenerationService.ts`
- Extend `TestGenerationOptions` with `syllabusData: { topic: string; percentage: number }[]`.
- Make `generateCustomTest` branch on `options.syllabusData?.length`.
- In that branch:
  - loop over raw syllabus items only
  - compute quota from `item.percentage` against `questionCount`
  - distribute any remainder to highest-percentage items so totals match exactly
  - fetch each subject/topic in isolation
  - do not use the old flat fallback path at all for job tests
- In `fetchSubjectQuota`, after slicing to quota, overwrite each returned question with `subject: requestedTopic` and `topic: requestedTopic` so UI labels are never blank or “General”.
- Keep `subjectDeficits` keyed by the same raw syllabus topic string.

3. Fix `supabase/functions/generate-test/index.ts`
- When AI-generated questions are inserted, save the incoming topic string into both `subject` and `topic`.
- Remove the current mismatch where one field uses sanitized text and the other uses raw text.
- Keep duplicate detection and existing validation logic unchanged.

4. Fix the hidden re-mixing problem in `src/pages/TestSession.tsx`
- The current polling logic is still pulling generic follow-up questions using only one topic, which can reintroduce English-heavy mixed content.
- Change polling so it does not request generic refill by the first topic for syllabus-driven job tests.
- Prefer stopping generic poll-based refill for syllabus sessions, or gate it so only explicit per-subject background generation updates the session.
- This is required, otherwise the earlier fixes will still get polluted after session start.

5. Verify subject labeling in the session UI
- Keep the existing subject badges.
- Confirm the active question badge, review badge, and syllabus map all use the forced subject/topic names coming from saved questions.
- Expected result: badges should show exact syllabus sections like English, Computer (MS Office), Math, GK instead of General.

Files to modify
- `src/components/mock-tests/JobTestsTab.tsx`
- `src/services/testGenerationService.ts`
- `src/pages/TestSession.tsx`
- `supabase/functions/generate-test/index.ts`

Deployment
- Deploy the `generate-test` edge function after the code changes.

Technical notes
- The main failure is not just quota math; it is that raw syllabus data is not the source of truth, and later background loading reintroduces generic questions.
- The “Section: General” badge is only a symptom of missing `subject` values on fetched/generated questions.
- If only the three requested edits are made without fixing session polling, the app can still look broken even after generation logic is corrected.
