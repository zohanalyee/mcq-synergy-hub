

# Fix: AI-Generated Questions Not Saving Due to Undefined Difficulty + Add Subject Fallback

## Root Cause (Confirmed from Edge Function Logs)

The `generate-test` edge function crashes during the save step at line 994:

```
difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
```

When the Syllabus Builder sends `difficulty: undefined` (for "mixed" mode), this line throws:
```
TypeError: Cannot read properties of undefined (reading 'charAt')
```

The error is caught at line 1071-1073 and counted as `flaggedCount++`, so the function reports "15/15 saved (0 approved, 15 flagged)" -- but **zero questions are actually inserted into the database**. The client then re-fetches, finds 0 questions, and shows "Generation Failed".

Additionally, the `topic_id` used in `forceSaveQuestion` (line 993) comes from the request body's singular `topic_id` field, which is `null` when the Syllabus Builder sends `topic_ids` (plural). This means even if the save succeeds, the questions won't be linked to topics, making them invisible to the re-fetch query.

## Fix 1: Handle Undefined Difficulty in Edge Function (CRITICAL)

**File: `supabase/functions/generate-test/index.ts`**

At line 994 inside `forceSaveQuestion`, replace the raw `difficulty` reference with a safe default:

```typescript
// Line 994 - currently:
difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase(),

// Fix to:
difficulty: (difficulty || 'Medium').charAt(0).toUpperCase() + (difficulty || 'Medium').slice(1).toLowerCase(),
```

Also add a normalization near line 765 (after request parsing) to ensure `difficulty` always has a value:

```typescript
// After line 765, add:
const safeDifficulty = difficulty || 'Medium';
```

Then use `safeDifficulty` throughout the bank_only flow.

## Fix 2: Resolve topic_id from topic_ids for Save Linkage (CRITICAL)

**File: `supabase/functions/generate-test/index.ts`**

Currently the function resolves the topic **name** from `topic_ids` but doesn't resolve a `topic_id` UUID for database linkage. After the topic name resolution block (around line 757), add:

```typescript
// Resolve topic_id for FK linkage if topic_ids provided but topic_id is not
let resolvedTopicId = topic_id || null;
if (!resolvedTopicId && topic_ids && Array.isArray(topic_ids) && topic_ids.length > 0) {
  resolvedTopicId = topic_ids[0]; // Use first topic_id for linkage
}
```

Then use `resolvedTopicId` instead of `topic_id` at line 993 in `forceSaveQuestion`.

## Fix 3: Add Subject-Wide Fallback in syllabusRAGFallback.ts

**File: `src/services/syllabusRAGFallback.ts`**

After the topic-level queries (both by topic_id and by difficulty fallback) return 0 results, add a third fallback that queries by subject. This ensures questions from the same subject are used when no topic-specific questions exist.

Add after the topic loop (around line 273), before the final return:

```typescript
// Subject-wide fallback if no topic-specific questions found
if (allQuestions.length === 0) {
  // Get subject_ids for selected topics
  const { data: topicSubjects } = await supabase
    .from('topics')
    .select('subject_id')
    .in('id', topicIds);
  
  const subjectIds = [...new Set(topicSubjects?.map(t => t.subject_id).filter(Boolean) || [])];
  
  if (subjectIds.length > 0) {
    // Get subject names for text matching
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')
      .in('id', subjectIds);
    
    const subjectNames = subjects?.map(s => s.name) || [];
    
    // Query questions matching these subject names
    for (const subjectName of subjectNames) {
      const { data } = await supabase
        .from('content_items')
        .select('id, title, options, correct_option, explanation, difficulty, subject, topic, topic_id')
        .eq('category', 'mcq')
        .eq('status', 'approved')
        .ilike('subject', subjectName)
        .limit(requestedCount);
      
      for (const row of data || []) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          allQuestions.push({ ... }); // map to SyllabusQuestion
        }
      }
    }
  }
}
```

Add `usedSubjectFallback: boolean` to the return type.

## Fix 4: Better Error Handling + Bank Fallback in SyllabusBuilder

**File: `src/components/syllabus-builder/SyllabusBuilder.tsx`**

In the `handleGenerateQuiz` function:

1. Add detailed logging of the AI generation response
2. After AI generation fails but `foundInBank > 0`, use bank questions as fallback (already partially implemented at line 443, but enhance with specific error messages for 429/402/500)
3. Add subject fallback notification toast when `updatedBank.usedSubjectFallback` is true

## Files Modified

1. **`supabase/functions/generate-test/index.ts`** -- Fix undefined `difficulty` crash + resolve `topic_id` from `topic_ids`
2. **`src/services/syllabusRAGFallback.ts`** -- Add subject-wide fallback (Priority 3) + return `usedSubjectFallback` flag
3. **`src/components/syllabus-builder/SyllabusBuilder.tsx`** -- Better error handling, subject fallback toast, detailed logging

## Expected Behavior After Fix

1. User selects topic with 0 questions, requests 50
2. Bank query: 0 topic questions found
3. Subject fallback: finds 20 questions from same subject
4. AI generates 30 more (difficulty defaults to "Medium" safely)
5. Questions save correctly with proper `topic_id` linkage
6. Re-fetch finds all 50 questions
7. Test created successfully
