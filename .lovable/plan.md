# Targeted Guest Bug Fixes (G1, G3, G4+B2)

Minimal, surgical edits only. No file rewrites. G2 untouched.

## 1. `src/services/guestQuestionService.ts` (G1)

- **Tier 4 query** — change `.ilike('subject', params.subjectName)` to `.ilike('subject', \`%${params.subjectName}%)` so partial subject names (e.g. "Physics 9th") match.
- **Add debug logs** immediately after each of the 4 `dedupePush(out, seen, data)` calls:
  - After tier 1: `console.log('[guestQ] after tier1:', out.length)`
  - After tier 2: `console.log('[guestQ] after tier2:', out.length)`
  - After tier 3 (both topic_id and topic-name sub-queries — log once at end of tier 3 block): `console.log('[guestQ] after tier3:', out.length)`
  - After tier 4: `console.log('[guestQ] after tier4:', out.length, '| validate sample:', out.slice(0,2).map(q => ({ hasOptions: !!q.options, optLen: Array.isArray(q.options) ? q.options.length : typeof q.options, hasAnswer: !!q.correct_answer })))`
- **Do not touch** `validate()` or `normalizeOptions()`.

## 2. `src/pages/SubjectContent.tsx` (G3)

- **Line 65** — change `useState<string>("Medium")` → `useState<string>("mix")`.
- **Line 428** (request body to `generate-test`) — replace `difficulty: difficulty,` with `...(difficulty && difficulty !== 'mix' ? { difficulty } : {}),` so no filter is sent when "mix".

## 3. `src/pages/SubjectContent.tsx` (G4 + B2)

- **Effect at line 690-707** — replace `if (!user) return;` with a guest branch that re-fires `startGuestSubjectQuiz` when the chosen topic equals `guestAllowedTopicId`:
  ```ts
  if (!user) {
    if (selectedTopicId && guestStarted) {
      const topicObj = dbTopics.find(t => t.id === selectedTopicId);
      if (topicObj && selectedTopicId === guestAllowedTopicId) {
        startGuestSubjectQuiz(topicObj);
      }
    }
    return;
  }
  ```
- **Same effect — dependency array** — change `[selectedTopicId, user]` → `[selectedTopicId, user, guestStarted, difficulty]`.
- `**handleTopicChange` (lines 672-687)** — current code calls `openGuestGate()` and `return` when `!user && value !== guestAllowedTopicId`, blocking the state update. Reorder so `setSelectedTopicId(value)` runs first when `value === guestAllowedTopicId`, ensuring the effect fires:
  ```ts
  const handleTopicChange = (value: string) => {
    if (!user && value !== "all" && value !== guestAllowedTopicId) {
      openGuestGate();
      return;
    }
    setSelectedTopicId(value);
    if (value === "all") {
      setSelectedTopic("all");
    } else {
      const topic = dbTopics.find(t => t.id === value);
      setSelectedTopic(topic?.name || "all");
    }
  };
  ```

## 4. G2 — no changes

`Math.min(parseInt(questionCount) || 10, 20)` cap and `guestAllowedTopicId` lock left intact.

## Verification

After edits, confirm changed line ranges per file:

- `src/services/guestQuestionService.ts` — Tier 4 query line + 4 log insertions.
- `src/pages/SubjectContent.tsx` — line 65, line 428, lines ~672-687, lines ~690-707.

No build/test run; user will verify in browser.   **Add to Section 3 (G4+B2) — edge case protection:**

`startGuestSubjectQuiz` ke andar ek guard add karo taake agar woh already same topic ke liye questions load kar chuka ho toh double-fetch na ho:

ts

```ts
if (!user) {
  if (selectedTopicId && guestStarted) {
    const topicObj = dbTopics.find(t => t.id === selectedTopicId);
    if (topicObj && selectedTopicId === guestAllowedTopicId) {
      // Guard: don't re-fetch if already loaded for this topic
      if (questions.length === 0 || currentTopicId !== selectedTopicId) {
        startGuestSubjectQuiz(topicObj);
      }
    }
  }
  return;
}
```

`currentTopicId` jo bhi variable hai jo currently loaded topic track karta hai — agar alag naam hai toh woh use karo. Agar koi tracking nahi hai toh sirf `questions.length === 0` wali condition kaafi hai.