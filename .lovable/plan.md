

## Plan: Fix Duplicate Subjects/Topics in Quiz Selectors

**Problem**: Classes like "Class 9" exist under multiple boards, and subjects like "Biology" exist under multiple board+class combos. The current selectors use `subject.name` as the value, so duplicate names cause incorrect matching (selecting "Biology" under Sindh Board also highlights "Biology" under Federal Board). Same issue with topics.

**Solution**: Use the unique database `id` as the selection value instead of `name`. Keep the display showing name + board/class badge.

### Changes

**1. `src/components/quizzes/LMSSubjectSelector.tsx`**
- Change `value` prop type from subject name to subject `id`
- Match selected subject by `s.id === value` instead of `s.name === value`
- On click, pass `subject.id` (or `''`) to `onValueChange`
- Display still shows `subject.name` + system/level badge

**2. `src/components/quizzes/LMSTopicSelector.tsx`**
- Change `value` to use topic `id` instead of `name`
- Match by `t.id === value`
- On click, pass `topic.id` to `onValueChange`

**3. `src/pages/Quizzes.tsx`**
- Store subject/topic IDs in state instead of names
- Update `onValueChange` callbacks to use IDs
- For topic fetching: fetch topics by subject ID from Supabase directly (instead of relying on `allTopics[subjectName]` which is name-based)
- Deduplicate topics in the topic list by name (same topic name under same subject should appear once)

**4. Topic fetching for Category B**
- When `selectedSubjectB` (now an ID) changes, fetch topics from `topics` table where `subject_id = selectedSubjectB`
- This replaces the current `allTopics[selectedSubjectB]` lookup which uses name-based keys and misses the LMS hierarchy

### Key Detail
- Boards (educational_systems) are already unique by design
- Classes/levels grouped under their board remain visually distinct via the `System › Level` group headers
- Subjects with the same name under different boards appear as separate selectable items, each under its own group header
- Topics with the same name under the same subject are deduplicated by name

