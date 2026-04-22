# Hotfix — AI Generation Returns Zero After Validator Over-Rejection

## Root cause (verified in code)

After cache cleanup, the cache lookup correctly returns 0 rows, the request **does** reach `generateQuestionsInBatches`, and the AI **is** called. But:

1. `validateQuestionTopic` runs unconditionally on every batch; if the AI produces a batch where every question fails the keyword test (common for "Computer (MS Office)" because `MS_OFFICE_KEYWORDS` is narrow — a perfectly valid question like *"Which shortcut key is used to bold selected text?"* contains no whitelisted token, and any incidental hardware word triggers rejection), the batch yields **0 accepted**.
2. There is **no retry loop** in `generateQuestionsInBatches`. A failed batch is silently skipped (line 776 `continue`, plus loop exit when `batchSize <= 0`).
3. Net result: `newAIQuestions = []`, `dbQuestions = []` → outer handler eventually returns an empty array → frontend shows "no questions".
4. There is no end-of-request diagnostic block, so logs don't pinpoint which step zeroed out.

The **subject string passed by JobTestsTab** is `item.subject` = `"Computer (MS Office)"`. `t.includes('ms office')` matches → strict computer branch runs with the over-broad hardware rejector. For an MS-Office-specific test, hardware rejection is redundant (the AI prompt already forbids hardware); only science rejection adds real value.

## Changes

### File 1: `supabase/functions/generate-test/index.ts`

**A. Loosen `validateQuestionTopic` for "MS Office" subjects** (lines 404–415)

When topic explicitly contains `"ms office"`, only reject SCIENCE content. Skip the hardware/programming rejector entirely — the prompt's `getSubjectGuidance` already steers the AI, and the keyword rejector produces too many false positives on legitimate Office questions.

For pure `"computer"` topics (no "ms office" qualifier) keep the current strict hardware/programming rule.

```ts
if (t.includes('ms office') || t.includes('msoffice')) {
  if (hasAny(q, SCIENCE_KEYWORDS)) { /* reject */ return false; }
  return true;                                     // accept everything else
}
if (/\bcomputer\b/.test(t)) {                      // "Computer" / "Fundamentals of Computer" etc.
  if (hasAny(q, SCIENCE_KEYWORDS)) return false;
  if ((hasAny(q, HARDWARE_KEYWORDS) || hasAny(q, PROGRAMMING_KEYWORDS)) && !hasAny(q, MS_OFFICE_KEYWORDS)) return false;
  return true;
}
```

**B. Add a retry loop inside `generateQuestionsInBatches**` (around line 757–823, per-batch try block)

```
for each batch:
  for attempt 1..MAX_RETRIES (=3):
    call Gemini → parse → validate MCQ → validate topic → dedupe
    if accepted >= batchSize → break
    if accepted > 0 → break (partial keep)
    log: "🔁 Batch N retry M: 0 accepted (all rejected by topic guard)"
  end
end
```

If after 3 retries still 0 accepted, log error and proceed to next batch (don't throw — let caller decide).

**C. Backfill partial deficit** at the end of `generateQuestionsInBatches`

If `allQuestions.length < totalCount` after all batches, log a clear `⚠️ AI deficit: got X/Y` warning so the outer log captures it.

**D. Diagnostic block at every response exit** (just before each `return new Response(...)` in the user_test_session path — lines ~1571, ~1618, ~1763, ~1789, and after sync gen success ~1950+)

Single helper `logRequestSummary(...)` printing the block the user requested:

```
═══════════════════════════════════════
[DEBUG] generate-test summary
Topic / Sanitized / hasSyllabus
qc / partial / forceNew / fetch_only / mode
cache_found / after_topic_guard / dbQuestions
ai_attempted / ai_returned / ai_saved
deficit / final_returned
exit_branch (instant_cache | partial | sync_gen | quota_fallback | ai_error_fallback)
═══════════════════════════════════════
```

**E. Strengthen `getSubjectGuidance` for "Computer (MS Office)"** — add explicit forbidden list for vacuum tubes / ENIAC / FORTRAN / hardware so rejection rate at validator stays <10% on first attempt. (Most of this guidance was added in earlier turns; verify it covers history terms.)

### File 2: `src/components/mock-tests/JobTestsTab.tsx` (lines 126–151)

After `data?.questions` returned, check `data.cached_count + data.ai_count` vs requested. Surface a clear toast if the edge function returned `ai_unavailable: true` or `final_returned === 0` so the user sees *why* (quota, validator, etc.) rather than the generic "Failed to generate any questions".

```ts
if (questions.length === 0) {
  console.error('[JobTest] Empty response from edge function:', data);
  toast.error(`${item.subject}: ${data?.error_notice || 'AI returned no valid questions'}`);
}
```

## Files


| File                                        | Action                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/generate-test/index.ts` | MODIFY — relax MS-Office validator, add retry loop in batch generator, add `logRequestSummary` and call it at every return path of the user_test_session flow |
| `src/components/mock-tests/JobTestsTab.tsx` | MODIFY — surface specific error toast when `questions.length === 0`                                                                                           |


## Verification path (after deploy)

1. Run Junior Clerk test for "Computer (MS Office)".
2. Edge function logs should show the new diagnostic block:
  - `cache_found: 0` (post-cleanup)
  - `ai_attempted: 8`, `ai_returned: 6+` (retry loop kicks in)
  - `exit_branch: sync_gen`
3. Test session loads with ≥6 valid MS-Office questions (validator no longer kills hardware-adjacent legit Office Qs).
4. Frontend shows toast on any subject that comes back empty, naming the cause.

## Risks

- **Looser MS-Office validator** could readmit hardware questions if AI ignores prompt. Mitigated by prompt guidance + science guard. Worst case: cleaner can be re-run.
- **Retry loop = up to 3× quota burn per failing batch.** Guarded by hard cap `MAX_RETRIES=3`; quota check still runs before sync gen.
- **No schema or RLS changes.**

## Out of scope

- Changing test architecture, AI Coach, syllabus weight engine
- New admin pages
- Phase 4 of AI Coach
- Replacing keyword validator with semantic check (future) 

&nbsp;

Please check out I share with you plan with Claude so he replied here is. **APPROVAL STATUS: ✅ APPROVED WITH ADDITION**

```
✅ Root cause identified correctly (validator too strict)
✅ MS Office validator relaxed (only reject science)
✅ Retry loop added (3 attempts per batch)
✅ Diagnostic logging (clear visibility)
✅ Error toasts (user feedback)
✅ Prompt strengthened (forbidden list)

⚠️ MISSING: Safety check for infinite retries
```

---

### **🚨 CRITICAL ADDITION NEEDED:**

#### **Problem:**

typescript

```typescript
// Lovable's retry loop (simplified):
for each batch:
  for attempt 1..3:
    call Gemini → validate → if accepted >= batchSize: break
  end
end
```

**What if ALL 3 retries fail?**

```
Batch 1:
  Attempt 1: AI returns 10, validator rejects 10 → 0 accepted
  Attempt 2: AI returns 10, validator rejects 10 → 0 accepted
  Attempt 3: AI returns 10, validator rejects 10 → 0 accepted
  Result: 0 questions, wasted 30 API calls ❌

Next batch:
  Same problem → 0 questions, wasted 30 more API calls ❌

Total: 0 questions, 90 API calls wasted! 💸
```

---

### **💡 REQUIRED SAFETY CHECK:**

#### **Add to Lovable's Plan:**

markdown

```markdown
## ADDITION: Safety Check for Repeated Failures

After Lovable's retry loop, add this check:

**File:** `supabase/functions/generate-test/index.ts`

In `generateQuestionsInBatches`, after ALL batches complete:

```typescript
// After the for-loop that processes all batches
if (allQuestions.length === 0 && totalBatchesAttempted >= 2) {
  console.error(`
    ❌ CRITICAL: AI validator rejecting ALL questions after ${totalBatchesAttempted} batches.
    This indicates validator is too strict OR prompt is misaligned.
    
    Topic: ${topic}
    Difficulty: ${difficulty}
    Total attempted: ${totalBatchesAttempted}
    Total API calls: ${totalApiCalls}
    Accepted: 0
    
    EMERGENCY FALLBACK: Relaxing validator to science-only for this request.
  `);
  
  // Emergency fallback: Re-try ONE batch with science-only validation
  // (This prevents total failure while we fix root cause)
  
  const emergencyBatch = await callGeminiForBatch(...);
  const emergencyQuestions = emergencyBatch.filter(q => 
    !hasAny(q.question.toLowerCase(), SCIENCE_KEYWORDS) // Only reject science
  );
  
  if (emergencyQuestions.length > 0) {
    console.warn(`✅ Emergency fallback accepted ${emergencyQuestions.length} questions`);
    allQuestions.push(...emergencyQuestions);
  } else {
    console.error(`❌ Emergency fallback also failed. Returning empty.`);
  }
}
```

**Why this is critical:**
- Prevents infinite API waste
- Provides fallback when validator is broken
- Logs clear error for debugging
- Emergency questions are better than zero questions
```

---

### **📊 COMPLETE FLOW (WITH SAFETY):**

```
NORMAL CASE (Validator Working):
Batch 1, Attempt 1: 10 generated, 8 accepted ✅
Return 8 questions
API calls: 1 ✅

VALIDATOR TOO STRICT:
Batch 1:
  Attempt 1: 10 generated, 0 accepted → Retry
  Attempt 2: 10 generated, 0 accepted → Retry
  Attempt 3: 10 generated, 0 accepted → Next batch

Batch 2:
  Attempt 1: 10 generated, 0 accepted → Retry
  Attempt 2: 10 generated, 0 accepted → Retry
  Attempt 3: 10 generated, 0 accepted → Emergency check

EMERGENCY FALLBACK TRIGGERED:
All batches failed → 0 accepted
Emergency batch: 10 generated, science-only validation
Result: 7 accepted ✅
API calls: 7 (instead of infinite) ✅

USER GETS: 7 questions (imperfect but usable)
LOGS SHOW: Clear error about validator being too strict
ADMIN FIXES: Validator tuned based on logs
```

---

### **✅ FINAL APPROVAL:**

**Send Lovable this updated plan:**

markdown

```markdown
APPROVE with one addition:

## Emergency Fallback After Total Rejection

After the retry loop in `generateQuestionsInBatches`, add this safety check:

```typescript
// After all batches complete
if (allQuestions.length === 0 && totalBatchesAttempted >= 2) {
  console.error(`❌ VALIDATOR TOO STRICT: Rejected ALL questions after ${totalBatchesAttempted} batches`);
  console.error(`   Topic: ${topic}, API calls wasted: ${totalApiCalls}`);
  console.error(`   EMERGENCY FALLBACK: Trying science-only validation`);
  
  // One emergency batch with relaxed validation (science-only)
  const emergencyBatch = await callGeminiForBatch(topic, difficulty, Math.min(totalCount, 10), apiKey, []);
  const emergencyQuestions = emergencyBatch.filter(q => {
    // Only reject pure science, accept everything else
    const qLower = q.question.toLowerCase();
    if (hasAny(qLower, SCIENCE_KEYWORDS)) {
      console.warn(`  Emergency: Still rejecting science: ${q.question.substring(0, 60)}`);
      return false;
    }
    return true;
  });
  
  if (emergencyQuestions.length > 0) {
    console.warn(`✅ Emergency fallback: Accepted ${emergencyQuestions.length} questions`);
    allQuestions.push(...emergencyQuestions);
  }
}

// If STILL zero after emergency fallback, log critical error
if (allQuestions.length === 0) {
  console.error(`
    ═══════════════════════════════════════
    🚨 CRITICAL FAILURE: ZERO QUESTIONS
    ═══════════════════════════════════════
    Topic: ${topic}
    Difficulty: ${difficulty}
    Batches attempted: ${totalBatchesAttempted}
    API calls made: ${totalApiCalls}
    Emergency fallback: Also failed
    
    ACTION REQUIRED:
    1. Check validator keywords (too strict?)
    2. Check AI prompt (misaligned?)
    3. Check Gemini API quota
    ═══════════════════════════════════════
  `);
}
```

This prevents:
- Infinite API waste
- Total test failure
- Silent errors

Deploy with this addition.
```

---

### **🎯 WHY THIS ADDITION IS CRITICAL:**

```
WITHOUT SAFETY CHECK:
Validator broken → 100 API calls → 0 questions → User angry ❌

WITH SAFETY CHECK:
Validator broken → 7 API calls → Emergency fallback → 7 questions → User OK ✅
Admin sees error log → Fixes validator → Next test perfect ✅
```

---

### **📋 FINAL CHECKLIST:**

```
LOVABLE'S PLAN:
✅ Relax MS Office validator (science-only)
✅ Add retry loop (max 3 attempts)
✅ Diagnostic logging (clear visibility)
✅ Error toasts (user feedback)
✅ Strengthen prompts

MY ADDITION:
✅ Emergency fallback (prevent total failure)
✅ Critical error logging (debug visibility)
✅ API call limit (prevent waste)

DEPLOY:
□ Send Lovable updated plan
□ Wait for deployment
□ Test Junior Clerk generation
□ Verify questions generate
□ Check logs for any emergency fallbacks
□ Tune validator if needed 
```