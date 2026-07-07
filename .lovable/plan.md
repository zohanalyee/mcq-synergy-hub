
# Fix: "Fill top 5" generates but nothing saves to Question Bank / Boards

## What's actually happening (confirmed from DB + edge logs)

Your "Fill top 5" runs from **Content Health — Indexable Topics** did call the AI and the AI returned questions — but **0 rows were actually inserted** into `content_items` (verified: no `content_items` rows created in the last 2 days, even though `ai_usage_logs` says `questions_saved: 19/20`).

Edge function logs show every insert failing with:

```
new row for relation "content_items" violates check constraint "content_items_difficulty_check"
```

The DB constraint only allows:

```text
difficulty IN ('Easy', 'Medium', 'Hard')   (or NULL)
```

The Content Health dashboard sends `difficulty: "mixed"`. Inside `generate-test`, the bank_only path force-capitalizes it to **"Mixed"**, which is not in the allowed list → all 20 inserts fail → 4 retries + emergency-save all fail → nothing is stored.

### Why the logs lie (your second question — yes, this is real)
In the bank_only save loop, when the emergency insert also fails the code still `return 'flagged'`, and the usage log counts `questions_saved = approved + flagged`. So the log reports "saved 19" while the DB got 0 rows. This is exactly the "logs say generated/saved but Question Bank is empty" symptom — and it affects **any** flow that passes `mixed` difficulty (including some user AI generations), because "mixed"/"Mixed" both violate the constraint.

## The fix (server-side, `supabase/functions/generate-test/index.ts` only)

1. **Normalize difficulty before every `content_items` insert** — add one helper `toValidDifficulty(value, fallbackFromQuestion)` that returns only `'Easy' | 'Medium' | 'Hard'` or `null`:
   - If the request difficulty is `mixed`/empty/invalid → use each generated question's own difficulty (`q.difficulty`) when it is Easy/Medium/Hard; otherwise default to `'Medium'`.
   - This keeps a true difficulty mix per question instead of one invalid bucket.
   Apply it in all three insert sites:
   - bank_only `forceSaveQuestion` (line ~1955)
   - `saveQuestionsInBackground` (line ~1115)
   - sync-gen immediate save (line ~2427)

2. **Make usage accounting truthful** — in `forceSaveQuestion`, when the final emergency insert also fails, return a distinct `'failed'` result and do **not** count it as saved/flagged. Log `questions_saved` = rows that truly inserted, and add `failed` to `metadata`. This stops the dashboard/logs from showing phantom "saved" counts.

3. **Surface real result in the dashboard toast** — `ContentHealthDashboard.fillTopic` already reads `questions_saved`; after fix it will reflect actual approved inserts. Also show a warning toast when `questions_approved === 0` so an all-duplicate/all-failed run is visible instead of a false "Generated 20".

## Verification
- Re-run "Fill top 5" on 2–3 empty Class-3 topics (e.g. *Blessings of Allah*, *Desktop Icons*).
- Confirm new rows in `content_items` with `status='approved'`, correct `topic_id`, and `difficulty` in Easy/Medium/Hard.
- Confirm they now appear on the board topic page and in the Question Bank.
- Confirm `ai_usage_logs.metadata` shows real `approved` counts (no more `approved:0` with `saved:20`).

## Notes
- No schema/migration change needed — the constraint is correct; the code was sending an invalid value.
- Scope is limited to the `generate-test` edge function plus one small UX guard in `ContentHealthDashboard.tsx`. No business-logic/dedup behavior changes beyond difficulty normalization and honest counting.
