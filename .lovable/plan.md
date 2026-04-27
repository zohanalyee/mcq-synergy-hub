# Quiz & Subject Pages Activation Audit

## Executive Summary

The database, edge functions, and routing are **already in place and healthy**. Both systems are not actually "broken at the infrastructure level" — they are **gated by deliberate UI code** added during the AI cost-control phase.

Database snapshot (live):

- `content_items` (mcq, approved): **6,439** questions
- `subjects`: 157, `topics`: 1,380, `educational_systems`: 7, `levels`: 39
- `external_opportunities`, `job_test_definitions`, etc. unrelated to this audit

Verdict:

- **Quiz system** = UI handlers are no-ops with a toast saying "AI Quiz Generation Temporarily Unavailable". Backend is ready. **Activation is a small frontend wiring task.**
- **Subject system** = Already functional end-to-end (route → page → edge function → DB). The "not working" symptom is most likely caused by missing `location.state` when users land on `/subject/:id` directly (deep link / refresh), which triggers an immediate redirect to `/subjects`. **Activation is a routing/state hardening task.**

No new tables. No new edge functions. No schema migrations needed.

---

## QUIZ SYSTEM AUDIT

### Current State

**Database:** none of its own. Reuses `content_items` (category=`mcq`) and `custom_test_sessions` for runtime sessions.

**Edge function:** `generate-test` (already deployed, 2,038 LOC) — supports `topic`, `difficulty`, `question_count`, `fetch_only`, `forceNew`, `partial_mode`. Returns `{ questions, source, cached_count, ai_count }`.

**Frontend:**

- Route: `/quizzes` → `src/pages/Quizzes.tsx` (renders fine)
- UI: Two tabs (Subject Quiz, Topic Quiz) with `LMSSubjectSelector` + `LMSTopicSelector`, sliders for question count + time limit, "Start Quiz" buttons.
- Runtime player: `src/pages/TestSession.tsx` at `/test-session/:id` (already functional, used by Mock Tests + Custom Quizzes).
- Session storage: `custom_test_sessions` table (RLS already correct).

### Issues Found

1. `**handleStartSubjectQuiz` and `handleStartTopicQuiz` are stubbed** — both just call `toast.error("AI Quiz Generation Temporarily Unavailable")` and return. (Quizzes.tsx lines 71-90).
2. There is **no navigation** from the Quiz page to `TestSession`. The flow dead-ends at the toast.
3. `CustomQuizzes` (linked from `/custom-quizzes`) already does the correct flow we need to mirror — it generates questions, inserts into `custom_test_sessions`, and navigates to `/test-session/{id}`.

### Activation Plan

**No DB changes. No edge function changes.** Frontend wiring only:

1. Replace the two disabled handlers in `src/pages/Quizzes.tsx` with the real flow:
  - Call `supabase.functions.invoke('generate-test', { body: { topic, difficulty: 'Medium', question_count, fetch_only: true } })` (DB-only, no AI cost) — falls back to `fetch_only: false` only if cache is empty and the user explicitly opts in.
  - Insert a row into `custom_test_sessions` with the returned questions, `time_limit`, `question_count`, and a session name.
  - `navigate('/test-session/' + insertedId)`.
2. For "Subject Quiz" (Category A): pass `topic = subject_name` so the edge function pulls a random mix across all topics in that subject.
3. For "Topic Quiz" (Category B): pass `topic = selected_topic_name` for focused practice.
4. Add a small loading state + error toast for empty-bank case (suggest Question Bank as fallback).
5. Auth gate: wrap `/quizzes` in `InstantAuthGuard` (consistent with `/mock-tests` and `/custom-quizzes`) so we can persist session rows.

Estimated effort: **2–3 hours**. Complexity: **Low**.

---

## SUBJECT SYSTEM AUDIT

### Current State

**Database:** `subjects`, `topics`, `educational_systems`, `levels`, plus `content_items` for MCQs. All populated and RLS-correct.

**Edge function:** same `generate-test` (used as DB-first MCQ loader on the subject page).

**Frontend:**

- `/subjects` → `src/pages/Subjects.tsx` — grid of subjects from LMS, search + filters, navigates with `state` payload.
- `/subject/:id` and `/subject-content/:id` → `src/pages/SubjectContent.tsx` — topic list, MCQ practice cards, mode toggle, offline cache, AI fallback.
- Hooks/services already exist: `useSubjectsPageData`, `getTopicsBySubject`, `getCachedQuestions`, `setCachedQuestions`.

### Issues Found

1. **Hard dependency on `location.state` (CRITICAL).** `SubjectContent.tsx` line 97-100:
  ```ts
   if (!title) { navigate("/subjects"); return; }
  ```
   On a direct visit, refresh, or any deep link to `/subject/:id` (e.g. from `BoardTopicPage`'s `PracticeModeButtons` which uses `Link to=/subject/${subjectId}?...` **without state**), `title` is undefined and the page bounces back. This is the single biggest cause of "Subject pages not working".
2. `PracticeModeButtons` (`src/components/board-topic/PracticeModeButtons.tsx`) navigates to `/subject/${subjectId}?topic=...` with no router state — guaranteed redirect loop to `/subjects`.
3. No SSR/SEO-friendly fallback: even when state is missing, we should fetch the subject row from `subjects` by `id` (param) and rebuild the context.
4. Topic filtering relies on `selectedTopic` name string, but the URL param uses topic **id**. The auto-select effect handles it, but the initial `loadMCQs` call (inside the first `useEffect`) runs before topic auto-select, so it fetches by subject name not topic — minor UX issue.

### Activation Plan

**No DB changes. No edge function changes.** Frontend only:

1. **Hydrate state from URL param when `location.state` is missing** in `SubjectContent.tsx`:
  - On mount, if `!title`, fetch the subject by `id` from the `subjects` table (already accessible) and join `levels` + `educational_systems` for the SEO/breadcrumb context.
  - Only redirect to `/subjects` if the subject id truly does not exist.
2. **Update internal links to pass state OR rely on the new hydration.** Easiest path: keep links as-is and let the page hydrate itself (Option 1 covers it).
3. **Defer initial `loadMCQs` until topic auto-select runs** if `topicIdFromUrl` is present, so the first fetch already filters by topic.
4. **Add a friendly empty-state** for subjects with zero approved MCQs (currently a generic error toast).
5. (Optional, recommended) Add an `<InstantAuthGuard>` only around the *practice* action if we want to require sign-in to record progress — but read mode should remain public for SEO.

Estimated effort: **3–4 hours**. Complexity: **Low–Medium** (mostly around the hydration fetch and ensuring breadcrumbs/SEO still render).

---

## INTEGRATION WITH JOB TESTS

- Both systems already share the same primitives Job Tests use:
  - `custom_test_sessions` for session persistence
  - `/test-session/:id` (`TestSession.tsx`) as the universal player
  - Universal gamification + result tracking (per `mem://features/universal-gamification-system`)
- No changes needed to the Job Test system. After activation, Quiz and Subject flows will surface in the same "Recent activity" + streak/badges layer automatically.

---

## ACTIVATION ROADMAP

**Day 1 (Quiz activation, ~3h)**

- Wire `handleStartSubjectQuiz` and `handleStartTopicQuiz` to `generate-test` + `custom_test_sessions` insert + navigate.
- Add `InstantAuthGuard` to `/quizzes`.
- Manual QA: Subject Quiz → 10 Qs → submit → results.

**Day 1–2 (Subject pages activation, ~4h)**

- Add `hydrateFromId` fallback in `SubjectContent.tsx` (fetch subject by URL id when state missing).
- Fix initial `loadMCQs` to respect `topicIdFromUrl` on first run.
- Add empty-state UI for subjects with 0 MCQs.
- Manual QA: visit `/subject/<uuid>` directly, refresh page, deep link from `BoardTopicPage`.

**Day 2 (Polish, ~2h)**

- Add Quiz/Subject flow to analytics (GA4 events per `mem://analytics/ga4-integration-specification`).
- Update SEO meta on `SubjectContent` to include subject + level + system context after hydration.
- Verify gamification fires on completion.

Total: **~1–1.5 working days**. Recommended order: **Quiz first** (smaller, isolated), then **Subject hydration** (touches SEO/routing).

## Technical Notes (for implementer)

- Use `fetch_only: true` in `generate-test` calls from the Quiz page to keep AI costs at zero by default. Add an explicit "Generate fresh with AI" button if/when AI is re-enabled.
- The `custom_test_sessions` insert pattern is already implemented in `src/pages/CustomQuizzes.tsx` — copy that flow for consistency.
- For SubjectContent hydration, query: `supabase.from('subjects').select('id,name,level_id,levels(id,name,system_id,educational_systems(id,name))').eq('id', id).maybeSingle()` (verify foreign keys via `code--view` on `src/integrations/supabase/types.ts` before coding).
- Do NOT modify `generate-test` or any DB schema — both are working as designed. # ACTIVATE QUIZ & SUBJECT SYSTEMS
  ## Context
  Both systems are ready at infrastructure level. Only UI wiring needed.
  ## PRIORITY 1: Quiz System Activation (Day 1, ~3h)
  **File:** `src/pages/Quizzes.tsx`
  ### Task 1: Replace Disabled Handlers
  **Lines 71-90:** Replace both `handleStartSubjectQuiz` and `handleStartTopicQuiz` with real implementation:
  ```typescript
  const handleStartSubjectQuiz = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }
    setIsGenerating(true);
    
    try {
      // Call generate-test edge function (DB-only mode)
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: selectedSubject,
          difficulty: 'Medium',
          question_count: questionCount,
          fetch_only: true  // DB-only, zero AI cost
        }
      });
      if (error) throw error;
      
      if (!data?.questions || data.questions.length === 0) {
        toast.error('No questions available for this subject. Try another subject or visit Question Bank.');
        return;
      }
      // Create test session
      const { data: session, error: sessionError } = await supabase
        .from('custom_test_sessions')
        .insert({
          user_id: [user.id](http://user.id),
          questions: data.questions,
          time_limit: timeLimit * 60, // Convert minutes to seconds
          question_count: data.questions.length,
          session_name: `${selectedSubject} Quiz - ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();
      if (sessionError) throw sessionError;
      // Navigate to test session
      navigate`/test-session/${session.id}`);
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error('Failed to start quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  const handleStartTopicQuiz = async () => {
    if (!selectedTopic) {
      toast.error('Please select a topic');
      return;
    }
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: selectedTopic,
          difficulty: 'Medium',
          question_count: questionCount,
          fetch_only: true
        }
      });
      if (error) throw error;
      
      if (!data?.questions || data.questions.length === 0) {
        toast.error('No questions available for this topic. Try another topic or visit Question Bank.');
        return;
      }
      const { data: session, error: sessionError } = await supabase
        .from('custom_test_sessions')
        .insert({
          user_id: [user.id](http://user.id),
          questions: data.questions,
          time_limit: timeLimit * 60,
          question_count: data.questions.length,
          session_name: `${selectedTopic} Quiz - ${new Date().toLocaleDateString()}`
        })
        .select()
        .single();
      if (sessionError) throw sessionError;
      navigate`/test-session/${session.id}`);
      
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast.error('Failed to start quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  ```
  ### Task 2: Add Loading State
  Add state variable:
  ```typescript
  const [isGenerating, setIsGenerating] = useState(false);
  ```
  Update buttons to show loading:
  ```typescript
  <Button 
    onClick={handleStartSubjectQuiz}
    disabled={!selectedSubject || isGenerating}
  >
    {isGenerating ? 'Generating...' : 'Start Quiz'}
  </Button>
  ```
  ### Task 3: Add Auth Guard
  **File:** `src/App.tsx` (or wherever routes are defined)
  Wrap quiz route:
  ```typescript
  <Route 
    path="/quizzes" 
    element={
      <InstantAuthGuard>
        <Quizzes />
      </InstantAuthGuard>
    } 
  />
  ```
  ## PRIORITY 2: Subject Pages Activation (Day 1-2, ~4h)
  **File:** `src/pages/SubjectContent.tsx`
  ### Task 1: Add State Hydration
  Add this after existing state declarations (around line 95):
  ```typescript
  const { id: subjectId } = useParams();
  const [hydratedSubject, setHydratedSubject] = useState<any>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  // Hydrate state from database when location.state is missing
  useEffect(() => {
    const hydrateSubjectData = async () => {
      if (title || !subjectId) return; // Already have state or no ID
      
      setIsHydrating(true);
      
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select(`
            id,
            name,
            level_id,
            levels (
              id,
              name,
              system_id,
              educational_systems (
                id,
                name
              )
            )
          `)
          .eq('id', subjectId)
          .single();
        if (error) throw error;
        
        if (data) {
          // Hydrate the component state
          setHydratedSubject({
            title: [data.name](http://data.name),
            id: [data.id](http://data.id),
            levelId: data.level_id,
            levelName: data.levels?.name,
            systemId: data.levels?.system_id,
            systemName: data.levels?.educational_systems?.name
          });
        } else {
          // Subject doesn't exist, redirect
          toast.error('Subject not found');
          navigate('/subjects');
        }
      } catch (error) {
        console.error('Subject hydration error:', error);
        toast.error('Failed to load subject');
        navigate('/subjects');
      } finally {
        setIsHydrating(false);
      }
    };
    hydrateSubjectData();
  }, [subjectId, title]);
  ```
  ### Task 2: Update Component to Use Hydrated State
  Replace references to `title` with:
  ```typescript
  const subjectTitle = title || hydratedSubject?.title;
  const subjectData = location.state || hydratedSubject;
  ```
  Update the redirect logic (line 97-100):
  ```typescript
  // Only show loading while hydrating
  if (isHydrating) {
    return <div>Loading subject...</div>;
  }
  // Only redirect if we truly don't have subject data
  if (!subjectTitle && !isHydrating) {
    navigate('/subjects');
    return null;
  }
  ```
  ### Task 3: Add Empty State UI
  When `loadedQuestions.length === 0`:
  ```typescript
  {loadedQuestions.length === 0 && !loading && (
    <div className="text-center py-12">
      <p className="text-gray-600 mb-4">
        No questions available for {subjectTitle} yet.
      </p>
      <Button onClick={() => navigate('/question-bank')}>
        Browse Question Bank
      </Button>
    </div>
  )}
  ```
  ### Task 4: Update SEO Meta Tags
  Add to page head when hydrated:
  ```typescript
  useEffect(() => {
    if (subjectTitle) {
      document.title = `${subjectTitle} - MCQs & Practice | MCQsAI`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Practice ${subjectTitle} with MCQs, quizzes, and mock tests. ${subjectData?.levelName || ''} ${subjectData?.systemName || ''}`
        );
      }
    }
  }, [subjectTitle, subjectData]);
  ```
  ## PRIORITY 3: Analytics & Polish (Day 2, ~2h)
  ### Add Analytics Events
  Track quiz starts:
  ```typescript
  // In quiz handlers
  trackEvent('quiz_started', {
    quiz_type: 'subject', // or 'topic'
    subject: selectedSubject,
    question_count: questionCount
  });
  ```
  Track subject page views:
  ```typescript
  // In SubjectContent
  useEffect(() => {
    if (subjectTitle) {
      trackEvent('subject_page_view', {
        subject: subjectTitle,
        level: subjectData?.levelName,
        system: subjectData?.systemName
      });
    }
  }, [subjectTitle]);
  ```
  ## Testing Checklist
  ### Quiz System:
  - [ ] Subject quiz generates and starts
  - [ ] Topic quiz generates and starts
  - [ ] Loading states show
  - [ ] Empty state shows helpful message
  - [ ] Auth guard redirects non-logged users
  - [ ] Test session plays correctly
  - [ ] Results display properly
  ### Subject Pages:
  - [ ] Direct URL works: /subject/[uuid]
  - [ ] Page refresh doesn't break
  - [ ] Deep links from BoardTopicPage work
  - [ ] Breadcrumbs render correctly
  - [ ] SEO meta tags update
  - [ ] Empty state shows when no questions
  - [ ] Topic filtering works
  ## Deploy & Monitor
  After implementation:
  1. Deploy to production
  2. Monitor error logs for 24h
  3. Track analytics for quiz starts
  4. Track subject page views
  5. Verify no regressions in Job Tests
  Expected metrics after 1 week:
  - Quiz starts: 100-500/day
  - Subject page views: 500-2000/day
  - Zero cost (DB-only mode)
  - High completion rates
  Implement these changes in order (Quiz → Subject → Polish) and test thoroughly before deploying.