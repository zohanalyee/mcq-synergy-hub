

## Context (what I found)

The user's proposed "complete rewrite" assumes a different schema (`subjectId`, `content_items.subject_id`, `type='mcq'`, `status='published'`, `user_answers` table) that **does not match this project**. Our schema uses `topic`, `subject` (text), `category='mcq'`, `status='approved'`, and there is no `user_answers` table.

The actual edge function (`generate-test`) is already well-structured:
- Takes `topic` (not subjectId), already supports `partial_mode: false`
- Already has logging in `parseAIResponse` (raw text + validation pass count)
- Already accepts `correct_option`/lowercase aliases in `validateMCQ`
- The synchronous AI path goes through `generateQuestionsInBatches` → `parseAIResponse`

The frontend already passes `partial_mode: false` and `force_new: false`.

## Real gaps (small surgical fixes only)

1. **No visibility around the synchronous generation call** (line 1443+). When AI returns 0, we currently see batch logs but not a clear summary of cache vs. generated vs. final at the top-level for the deficit path.
2. **No warning when `parseAIResponse` returns 0 valid questions** even though raw text was non-empty — useful for diagnosing "AI failed silently".
3. **JobTestsTab** already correctly force-tags `subject` and `topic` (per previous fix) and caps at 20. No frontend changes needed.

There is **no `user_answers` table**, so the "adaptive learning" filter from the user's prompt can't be implemented as written. We already have a Fresh-Question-Exclusion system (per memory `fresh-question-exclusion-system`) that uses `custom_test_sessions` history — that's the existing mechanism.

## Plan (minimal, safe diagnostics)

### File: `supabase/functions/generate-test/index.ts`

**Change A — `parseAIResponse` (line 414):** add a loud warning when raw questions parsed but 0 passed validation:
```ts
if (rawQuestions.length > 0 && valid.length === 0) {
  console.error('[parseAIResponse] ⚠️ ALL questions failed validation. Sample:',
    JSON.stringify(rawQuestions[0]).substring(0, 400));
}
```

**Change B — Around the synchronous AI generation block (line ~1443, "FULL AI GENERATION"):** add a clear summary block before and after the AI call so logs always show:
```
[generate-test] 🔄 SYNC GEN: topic=X, deficit=N, cached=M, partial=false
...
[generate-test] ✅ SYNC GEN RESULT: ai_returned=Y, final=Z/qc
```

This pinpoints exactly whether the AI returns 0, validation drops everything, or save fails.

**No structural rewrite. No schema changes. No `subjectId` migration. No `user_answers` query.**

### File: `src/components/mock-tests/JobTestsTab.tsx`
**No changes.** It already passes `partial_mode: false`, force-tags subject/topic, and caps at 20.

### Deploy
Deploy `generate-test` and ask the user to start one Junior Clerk test, then we read the edge function logs to see exactly where the 0-question case occurs.

## Files Modified
| File | Change |
|------|--------|
| `supabase/functions/generate-test/index.ts` | Add warning log when validation drops all parsed questions; add SYNC GEN summary logs around the synchronous AI block |

## Why I'm NOT doing the user's proposed rewrite
- It rewrites `serve()` to use `subjectId` — our function uses `topic` and there is no `subject_id` column on `content_items` in the call path
- It queries `user_answers` table — doesn't exist
- It inserts with `type='mcq'`/`status='published'` — our schema uses `category='mcq'`/`status='approved'`
- Doing that rewrite would break Subject Tests, Syllabus Builder, auto-fill, and admin bulk generator

After deploying these diagnostics, we'll know the real cause from one test run and can apply a precise fix.

