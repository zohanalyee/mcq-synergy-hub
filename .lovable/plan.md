## Goal

Guest users (not signed in) on `/quizzes` Subject and Topic tabs must load questions **directly from the `content_items` table via the Supabase client** — no `generate-test` edge function invocation, no AI generation, no credit deduction. Logged-in users keep current hybrid (DB + AI) behavior unchanged.

## Why

Edge function calls for guests are unnecessary and currently route through `generate-test`, which (even with `fetch_only: true`) wastes function quota and is more failure-prone than a direct PostgREST query. Guests already have read access via the `Anyone can view approved content` RLS policy on `content_items`.

## Scope

Only `src/pages/Quizzes.tsx` (the `startQuiz` function). No DB changes, no edge function changes, no UI changes.

## Plan

### 1. Add a client-side guest fetcher in `src/pages/Quizzes.tsx`

New helper `fetchGuestQuestionsFromDB(opts)` that queries `content_items` directly with strict scoping:

- **Topic Quiz** (when `topic_id` present): filter by `topic_id = opts.topicId`.
- **Subject Quiz** (no `topic_id`): resolve all `topic_id`s for the subject from the `topics` table, then filter `content_items` with `.in('topic_id', topicIds)`. Also OR-match `canonical_topic_name` in the resolved canonical list, mirroring the edge function's subject-wide search.
- Always add: `.eq('status', 'approved')`, `.eq('question_type', 'mcq')` (if applicable), and select only the fields the player needs (`id, question, options, correct_option, explanation, subject, topic, difficulty`).
- Fetch up to `Math.max(opts.questionCount * 3, 60)` rows, then **shuffle client-side** and slice to `opts.questionCount` for randomness (PostgREST has no native random ordering).
- Map rows into the same question shape the player expects (`{ id, question, options: [...], correct_option, explanation, subject, topic, difficulty }`).

### 2. Branch in `startQuiz` based on auth state

```text
if (!user) {
  questions = await fetchGuestQuestionsFromDB(...)   // DB only, no edge fn
  if (questions.length === 0) {
    toast: "This topic has no cached questions yet. Sign in free to generate with AI."
    return
  }
} else {
  // existing path: supabase.functions.invoke('generate-test', ...)
}
```

The existing guest sessionStorage write + slug navigation stays exactly the same.

### 3. Keep logged-in flow untouched

The `supabase.functions.invoke('generate-test', ...)` call and `custom_test_sessions` insert remain only inside the `user` branch.

## Technical Details

- **No DB migration needed.** RLS already allows anon SELECT on `content_items WHERE status = 'approved'`.
- **No edge function changes.** The `fetch_only` guest branch in `generate-test` becomes unused for the Quizzes page (still used by other surfaces if any).
- **Randomization**: Fisher–Yates shuffle in JS over the oversampled result set.
- **Subject resolution for Subject Quiz**: one extra query to `topics` (`select id, canonical_name where subject_id = ...`) before the `content_items` query, matching the strict scoping the edge function does today.
- **Empty-state UX**: same toast pattern that prompts guests to sign in for AI generation when DB has no rows.

## Out of Scope

- Mock Tests page (Subject/Topic tabs there already work for guests via the edge function — separate from this request).
- Any change to credits, gamification, sign-in gate at result screen, or the player itself.

# Guest Quiz Optimization - Direct DB Access

## Goal

Guest users on `/quizzes` should fetch questions directly from the database without calling the edge function. This is faster, simpler, and doesn't waste server quota.

## Changes Needed

### 1. Add Direct DB Fetcher

**File: src/pages/Quizzes.tsx**

Add this new function:

```typescript

interface FetchGuestQuestionsOptions {

  subjectId: string;

  topicId?: string;

  questionCount: number;

}

async function fetchGuestQuestionsFromDB(

  opts: FetchGuestQuestionsOptions

): Promise<any[]> {

  

  let query = supabase

    .from('content_items')

    .select('id, question, options, correct_option, explanation, subject, topic, difficulty')

    .eq('status', 'approved')

    .eq('question_type', 'mcq');

  // Topic Quiz - filter by specific topic

  if (opts.topicId) {

    query = query.eq('topic_id', opts.topicId);

  } 

  // Subject Quiz - filter by all topics in subject

  else {

    const { data: topics } = await supabase

      .from('topics')

      .select('id, canonical_name')

      .eq('subject_id', opts.subjectId);

    

    if (!topics || topics.length === 0) return [];

    

    const topicIds = [topics.map](http://topics.map)(t => [t.id](http://t.id));

    const canonicalNames = [topics.map](http://topics.map)(t => t.canonical_name).filter(Boolean);

    

    query = query.or(

      `topic_id.in.(${topicIds.join(',')}),` +

      `canonical_topic_name.in.(${canonicalNames.join(',')})`

    );

  }

  // Fetch 3x more for randomization

  const fetchCount = Math.max(opts.questionCount * 3, 60);

  const { data } = await query.limit(fetchCount);

  if (!data || data.length === 0) return [];

  // Fisher-Yates shuffle

  const shuffled = [...data];

  for (let i = shuffled.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];

  }

  return shuffled.slice(0, opts.questionCount);

}

```

### 2. Update startQuiz Function

Replace the current logic with:

```typescript

const startQuiz = async (opts) => {

  setGeneratingA(true); // or B based on which button

  

  let questions = [];

  

  // GUEST: Direct DB query (no edge function)

  if (!user) {

    questions = await fetchGuestQuestionsFromDB({

      subjectId: opts.subjectId,

      topicId: opts.topicId,

      questionCount: opts.questionCount,

    });

    

    if (questions.length === 0) {

      [toast.info](http://toast.info)(

        "This topic has no questions yet. Sign in free to generate with AI!",

        {

          action: {

            label: "Sign In",

            onClick: () => {

              saveIntentRaw({ action: 'Generate quiz', path: location.pathname });

              navigate('/auth');

            }

          },

          duration: 6000,

        }

      );

      setGeneratingA(false);

      return;

    }

  } 

  // LOGGED-IN: Edge function (DB + AI hybrid)

  else {

    const { data: genData } = await supabase.functions.invoke('generate-test', {

      body: {

        topic: topicForFetch,

        difficulty: 'Medium',

        question_count: opts.questionCount,

        fetch_only: false, // Allow AI

        forceNew: false,

        partial_mode: true,

      }

    });

    

    if (!genData?.questions || genData.questions.length === 0) {

      toast.error("Couldn't generate questions. Please try again.");

      setGeneratingA(false);

      return;

    }

    

    questions = genData.questions;

  }

  

  // Common: Create session (works for guest + logged-in)

  const { data: subjectRow } = await supabase

    .from('subjects')

    .select('name')

    .eq('id', opts.subjectId)

    .single();

  

  const { data: session } = await supabase

    .from('custom_test_sessions')

    .insert({

      user_id: user?.id || null,

      session_name: opts.sessionLabel,

      subjects: [[subjectRow.name](http://subjectRow.name)],

      topics: opts.topicName ? [opts.topicName] : [],

      question_count: questions.length,

      time_limit: opts.timeLimit,

      questions,

      is_active: true,

    })

    .select('id')

    .single();

  

  const slugUrl = generateSlugUrl(opts.topicName || [subjectRow.name](http://subjectRow.name), [session.id](http://session.id));

  navigate`/quiz-session/${slugUrl}`);

  setGeneratingA(false);

};

```

### 3. Hide AI Features for Guests

Update UI sections to hide AI-related options:

```typescript

{/* Fetch Only Toggle - HIDE for guests */}

{user && (

  <div className="flex items-center gap-2">

    <Switch checked={fetchOnly} onCheckedChange={setFetchOnly} />

    <Label>Use database questions only</Label>

  </div>

)}

{/* Different help text for guest vs logged-in */}

{!user ? (

  <p className="text-sm text-muted-foreground">

    📚 Practicing with curated questions

  </p>

) : (

  <p className="text-sm text-muted-foreground">

    {fetchOnly 

      ? "Using questions from database only"

      : `Will generate with AI if needed (${creditsRemaining} credits)`

    }

  </p>

)}

```

## Benefits

✅ Faster for guests (no edge function call)

✅ No server quota waste

✅ Simpler code path

✅ Fewer failure points

✅ Clean UI for guests (no confusing AI options)

✅ Logged-in users unchanged (still get AI generation)

## Testing

1. **Test as guest:**

   - Start quiz → Should use direct DB query ✅

   - Empty topic → Should show sign-in prompt ✅

   - No AI options visible ✅

2. **Test as logged-in:**

   - Start quiz → Should use edge function ✅

   - Empty topic → Should generate with AI ✅

   - AI options visible ✅

Deploy this to optimize guest experience.