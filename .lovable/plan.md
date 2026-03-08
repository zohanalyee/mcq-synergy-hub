## Plan: Auto-Sync Question Bank for Offline Access

### What It Does

When the Subjects page loads, it runs a background sync that pre-fetches questions for each visible subject from the question bank (database only, no AI) and stores them in `localStorage`. When a user opens any subject, `SubjectContent` checks the local cache first — if questions exist offline, they load instantly without any network call. A sync status indicator on each SubjectCard shows whether questions are cached.

### Architecture

```text
Subjects Page Load
  └─► Background loop: for each subject
        └─► supabase.functions.invoke('generate-test', { fetch_only: true })
        └─► localStorage.setItem('mcq_cache_{subjectId}', JSON.stringify({questions, timestamp}))

SubjectContent Page Load
  └─► Check localStorage for 'mcq_cache_{subjectId}'
        ├─ Found & fresh (< 24h) → use cached questions instantly
        └─ Stale or missing → fetch from DB as usual
```

### Files to Create/Modify

**1. `src/services/offlineSyncService.ts**` (NEW)

- `syncSubjectQuestions(subjectId, subjectName)` — calls `generate-test` with `fetch_only: true`, stores result in localStorage keyed by `mcq_cache_{subjectId}`
- `getCachedQuestions(subjectId)` — reads from localStorage, returns null if stale (>24h)
- `syncAllSubjects(subjects[])` — iterates subjects with a 500ms delay between each to avoid rate limits
- `getSyncStatus(subjectId)` — returns `{synced: boolean, count: number, lastSync: Date}`
- Cache format: `{ questions: MCQItem[], timestamp: number, subjectName: string }`

**2. `src/pages/Subjects.tsx**` — Add background sync

- After subjects load, call `syncAllSubjects(mappedSubjects)` in a `useEffect`
- Show a small toast: "Syncing questions for offline use..." with progress
- Each SubjectCard gets a small green dot indicator if questions are cached

**3. `src/components/SubjectCard.tsx**` — Add sync status badge

- Import `getSyncStatus` from offlineSyncService
- Show a small cached indicator (green dot or download icon) on subjects that have offline questions
- Display cached question count in tooltip

**4. `src/pages/SubjectContent.tsx**` — Use cached questions first

- On mount, before calling `loadMCQs`, check `getCachedQuestions(subjectId)`
- If cache hit: set MCQs immediately, show "Offline" source badge, skip network call
- If cache miss or stale: proceed with normal `loadMCQs(false, true)` flow
- After any successful DB/AI fetch, update the local cache

### Sync Strategy

- Background sync is non-blocking — subjects page remains interactive
- Only fetches from question bank (`fetch_only: true`) — zero AI cost
- 500ms delay between subjects to avoid rate-limiting
- Cache expires after 24 hours, re-syncs on next Subjects page visit
- Max localStorage usage ~5MB (sufficient for ~50 subjects × 20 questions each)

### Files Modified

- `src/services/offlineSyncService.ts` (new)
- `src/pages/Subjects.tsx`
- `src/components/SubjectCard.tsx`
- `src/pages/SubjectContent.tsx`  

if not availabe like empty subject user can genreate through AI as per his requirment of subject topic or diffuclty level or availble questions count