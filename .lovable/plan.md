# Make Syllabus Builder Fully Operational + Save User Preferences

## Current State Analysis

The Syllabus Builder already has most pieces working:

- Selection system with checkboxes (subjects and topics)
- Filter sidebar (Board/Class)
- Test settings panel (questions, time, difficulty)
- Save template feature
- Test session page with timer, scoring, results

**Critical Issue Found**: The question query in `syllabusRAGFallback.ts` resolves topic UUIDs to topic NAMES, then queries `content_items` by the `topic` text field. However, ~50% of questions (1,859 of 3,802) have `topic_id` set. The name-matching approach is fragile and misses questions where names don't match exactly. Querying by `topic_id` directly would be far more reliable.

**Other Issues**:

- No approved filtering on subjects/topics (shows AI-suggested items to students)
- No question availability count shown per topic
- No 100-question maximum enforcement
- Questions aren't distributed across topics (just fetched in bulk)
- No user generation preferences saved

---

## Part 1: Fix Syllabus Builder Core

### 1.1 Fix Question Fetching (Critical)

**File: `src/services/syllabusRAGFallback.ts**`

Replace the current `getQuestionsWithFallbackInfo` approach. Instead of resolving topic IDs to names and querying by text, query `content_items` directly using both `topic_id` (UUID) AND `topic` (text name) for maximum coverage:

```text
// Query by topic_id (UUID) for linked questions
const { data: byId } = await supabase
  .from('content_items')
  .select('*')
  .eq('category', 'mcq')
  .eq('status', 'approved')
  .in('topic_id', topicIds)
  .limit(requestedCount * 2);

// Also query by topic name for unlinked questions
const topicNames = topics?.map(t => t.name) || [];
const { data: byName } = await supabase
  .from('content_items')
  .select('*')
  .eq('category', 'mcq')
  .eq('status', 'approved')
  .is('topic_id', null)
  .in('topic', topicNames)
  .limit(requestedCount * 2);

// Merge and deduplicate by ID
const allQuestions = deduplicateById([...(byId || []), ...(byName || [])]);
```

This ensures we find questions regardless of whether they were linked by UUID or only by name.

### 1.2 Add Approved Filtering

**File: `src/components/syllabus-builder/hooks/useSyllabusData.ts**`

Add `.or('approved.eq.true,approved.is.null')` to both subjects and topics queries so students don't see AI-suggested unapproved items.

### 1.3 Show Question Availability Per Topic

**File: `src/components/syllabus-builder/SyllabusSubjectCard.tsx**`

Add a small badge next to each topic showing how many approved MCQs are available. Fetch counts in bulk from `content_items` grouped by `topic_id`.

**File: `src/components/syllabus-builder/hooks/useSyllabusData.ts**`

Add a query to fetch question counts per topic:

```text
const { data: counts } = await supabase
  .from('content_items')
  .select('topic_id')
  .eq('category', 'mcq')
  .eq('status', 'approved')
  .not('topic_id', 'is', null);

// Count per topic_id
const countMap = counts.reduce((acc, item) => {
  acc[item.topic_id] = (acc[item.topic_id] || 0) + 1;
  return acc;
}, {});
```

Pass this to subject cards so each topic shows "(30 Qs)" next to its name.

### 1.4 Enforce 100 Question Maximum

**File: `src/components/syllabus-builder/SelectionSummary.tsx**`

- Cap the questions slider at 100 (already max 100)
- Add validation: if `selectedTopicsCount * questionsCount > 100`, show a warning
- Disable Generate button if over limit
- Show estimated total: "~60 questions (3 topics x 20 each)"

### 1.5 Distribute Questions Across Topics

**File: `src/services/syllabusRAGFallback.ts**`

Instead of fetching all questions in one query, distribute the requested count across selected topics:

```text
const perTopicCount = Math.ceil(requestedCount / topicIds.length);

for (const topicId of topicIds) {
  const topicQuestions = await fetchForTopic(topicId, perTopicCount);
  allQuestions.push(...topicQuestions);
}

// Shuffle the combined result
const shuffled = allQuestions.sort(() => Math.random() - 0.5);
return shuffled.slice(0, requestedCount);
```

This ensures balanced representation across all selected topics.

---

## Part 2: Save User Generation Preferences

### 2.1 Database Migration

Create a new table for storing admin MCQ generation preferences:

```sql
CREATE TABLE public.user_generation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  default_difficulty TEXT DEFAULT 'Medium',
  default_quantity INTEGER DEFAULT 100,
  last_board_id UUID,
  last_class_id UUID,
  last_subject_id UUID,
  last_topic_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_generation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON public.user_generation_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2.2 Load Preferences on Mount

**File: `src/components/admin/AIContentFactory.tsx**`

On component mount, fetch saved preferences and pre-fill dropdowns:

```text
useEffect(() => {
  const loadPrefs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('user_generation_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setDifficulty(data.default_difficulty || 'Medium');
      setQuantity(data.default_quantity || 100);
      if (data.last_board_id) setSelectedSystem(data.last_board_id);
      // ... etc for class, subject, topic
    }
  };
  loadPrefs();
}, []);
```

### 2.3 Save Preferences After Generation

**File: `src/components/admin/AIContentFactory.tsx**`

After successful generation completes, upsert preferences:

```text
await supabase.from('user_generation_preferences').upsert({
  user_id: user.id,
  default_difficulty: difficulty,
  default_quantity: quantity,
  last_board_id: selectedSystem,
  last_class_id: selectedLevel,
  last_subject_id: selectedSubject,
  last_topic_id: selectedTopic,
  updated_at: new Date().toISOString()
});
```

---

## Files Modified

1. `src/services/syllabusRAGFallback.ts` -- Fix query to use topic_id + name fallback, add topic distribution
2. `src/components/syllabus-builder/hooks/useSyllabusData.ts` -- Add approved filtering, fetch question counts per topic
3. `src/components/syllabus-builder/SyllabusSubjectCard.tsx` -- Show question count per topic
4. `src/components/syllabus-builder/SelectionSummary.tsx` -- Add estimated total display, enforce 100 max warning
5. `src/components/admin/AIContentFactory.tsx` -- Load/save generation preferences
6. New migration: Create `user_generation_preferences` table

## No Edge Function Changes Required

All changes are frontend + database. The existing `generate-test` edge function and question bank service continue to work as-is.   Perfect! Approved for immediate implementation.

CONFIRMED FIXES:

Part 1 - Syllabus Builder:

✅ Fix question query (topic_id + name fallback)

✅ Add approved filtering (students see only approved)

✅ Show question count per topic "(45 Qs)"

✅ Enforce 100 question maximum with warning

✅ Distribute questions across selected topics

✅ Filters collapsed by default

Part 2 - User Preferences:

✅ Create user_generation_preferences table

✅ Load preferences on mount (AIContentFactory)

✅ Save preferences after generation

✅ Remember difficulty, quantity, last selections

CRITICAL FIX:

The topic_id query fix is ESSENTIAL - currently missing 50% of questions!

This explains why tests were failing to generate enough questions.

FILES MODIFIED:

1. syllabusRAGFallback.ts

2. useSyllabusData.ts

3. SyllabusSubjectCard.tsx

4. SelectionSummary.tsx

5. AIContentFactory.tsx

6. Database migration

TESTING PRIORITY:

After deployment, test:

1. Question finding (should find ALL questions now)

2. Topic count badges (show availability)

3. 100 max enforcement (warning + disable)

4. Distribution (balanced across topics)

5. Preferences (load/save working)

6. Filters (collapsed by default)

This is the FINAL feature before launch!

Please implement and deploy as soon as possible.