I will stop patching individual symptoms and refactor guest testing into one consistent flow.

## What I will change

1. Create one guest session source of truth

New shared helper:

```text
src/lib/guestSession.ts
```

It will define:

```ts
const GUEST_SESSION_PREFIX = 'mcqsai_guest_session_'

saveGuestSession(session)
loadGuestSession(id)
createGuestSessionId()
buildGuestSession({ questions, time_limit, subjects, topics })
```

Every guest flow will store exactly:

```ts
{
  id,
  questions,
  time_limit,
  subjects,
  topics,
  is_active: true
}
```

I will delete/replace every old key usage:

```text
mcqsai_guest_quiz_
mcqsai_guest_test_
```

with:

```text
mcqsai_guest_session_{id}
```

2. Create one DB-only guest question loader

New shared helper:

```text
src/services/guestQuestionService.ts
```

It will load approved bank questions only, never AI. It will validate only:

```ts
q && (q.question || q.title) && q.options
```

It will not block based on answer parsing.

It will return:

```ts
{
  rows,
  questions
}
```

And add the single temporary debug log:

```ts
console.log('GUEST FLOW:', {
  user,
  rows: rows.length,
  questions: questions.length
});
```

3. Fix Quizzes.tsx

I will change the quiz starter so the guest branch is first priority:

```ts
if (!user) {
  return startGuestFlow();
}
```

Guest behavior:

- use the shared DB-only loader
- if `questions.length > 0`, always create guest session and navigate to quiz
- if `questions.length === 0`, show only “No questions available”
- remove the “Sign in to access this topic” toast completely
- store with `mcqsai_guest_session_{id}` only

4. Fix SubjectContent.tsx

Guest page will be locked to only:

- topic selector
- 10 / 20 question selector
- Start Practice button

Guest page will not:

- preload full MCQ list
- show all question cards/options
- show cached count
- show refresh
- show generate
- call `generate-test`

Start Practice will use the shared guest loader and shared guest session helper.

5. Fix SyllabusBuilder

I will remove all auth redirects from syllabus generation.

Guest behavior:

```ts
if (!user) {
  return startGuestFlow();
}
```

Guest can:

- select syllabus topics
- load from question bank only
- create a guest session
- navigate to `/test-session/{id}`

Guest cannot:

- save template
- use AI generation

The save control will remain disabled with:

```text
Sign in to save your syllabus
```

6. Fix Mock Test guest session formats

Files:

```text
src/components/mock-tests/SubjectTestsTab.tsx
src/components/mock-tests/JobTestsTab.tsx
```

I will replace the old guest keys with the shared session helper.

I will also remove guest login/AI-generation toasts from fetch/start logic. Guests either get a DB-backed test or a simple “No questions available” message.

7. Fix QuizPlayer.tsx and TestSession.tsx loaders

Both players will load guest sessions only from:

```text
mcqsai_guest_session_{id}
```

No fallback to old keys.

8. Hard-block premium results for guests

In both result render paths:

```text
src/pages/QuizPlayer.tsx
src/pages/TestSession.tsx
```

Guest result will immediately return:

```tsx
<GuestResultGate ... />
```

before analytics/charts/weak areas/progress/reviews are computed or rendered.

9. Remove guest AI calls

I will verify with search that no guest branch contains:

```ts
supabase.functions.invoke('generate-test')
```

Logged-in AI behavior remains unchanged.

## Files to update

```text
src/lib/guestSession.ts
src/services/guestQuestionService.ts
src/pages/Quizzes.tsx
src/pages/SubjectContent.tsx
src/components/syllabus-builder/SyllabusBuilder.tsx
src/components/subject-content/MCQControls.tsx
src/components/mock-tests/SubjectTestsTab.tsx
src/components/mock-tests/JobTestsTab.tsx
src/pages/QuizPlayer.tsx
src/pages/TestSession.tsx
```

## Verification I will run after implementation

I will search the codebase to confirm:

```text
mcqsai_guest_quiz_        -> zero results
mcqsai_guest_test_        -> zero results
Sign in to access this topic -> zero results
navigate('/auth') inside guest test starts -> zero results
supabase.functions.invoke('generate-test') inside guest branches -> zero results
mcqsai_guest_session_ used by all guest session flows
```

This will make guest behavior consistent across quizzes, subject pages, syllabus builder, mock tests, and result pages.     ⚠️ **Ab IMPORTANT — 4 cheezein jo missing hain (ye add nahi ki to phir bug aayega)**

---

## 🔴 1. ❗ Session loader fallback missing (CRITICAL)

Abhi tum sirf new key use kar rahe ho:

```

```

```
mcqsai_guest_session_{id}
```

👉 Problem:  
  
Old sessions (existing users ya tab open flows) break ho jayenge

### ✅ FIX:

`loadGuestSession()` me fallback add karo:

```

```

```
const session =
  sessionStorage.getItem(`mcqsai_guest_session_${id}`) ||
  sessionStorage.getItem(`mcqsai_guest_quiz_${id}`) ||
  sessionStorage.getItem(`mcqsai_guest_test_${id}`);
```

✔️ Phir silently migrate:

```

```

```
if (oldKeyUsed) {
  sessionStorage.setItem(newKey, oldData);
}
```

---

## 🔴 2. ❗ Question normalization missing (hidden bug)

Tumne yeh condition lagayi:

```

```

```
q && (q.question || q.title) && q.options
```

👉 Yeh enough nahi hai.

Problem:

-   
options object ho sakta hai  

-   
array ho sakta hai  

-   
inconsistent formats break UI later  


---

### ✅ FIX (must add):

```

```

```
function normalize(q) {
  let options = [];

  if (Array.isArray(q.options)) {
    options = q.options.map((opt, i) => ({
      key: String.fromCharCode(65 + i),
      text: typeof opt === 'string' ? opt : opt?.text
    }));
  } else if (typeof q.options === 'object') {
    options = Object.entries(q.options).map(([k, v]) => ({
      key: k,
      text: v
    }));
  }

  return {
    id: q.id,
    question: q.question || q.title,
    options,
    correctOption: q.correct_option || 'A'
  };
}
```

👉 Warna:  
  
“questions load ho gaye but UI break” wala bug phir aayega

---

## 🔴 3. ❗ Navigation returnPath not enforced everywhere

Tumne mention kiya but enforce nahi kiya.

### ✅ Fix:

Har navigate me:

```

```

```
navigate(`/quiz-session/${id}`, {
  state: { returnPath: location.pathname }
});
```

Aur ResultGate me:

```

```

```
navigate(returnPath || '/quizzes');
```

👉 Warna UX toot jata hai (back flow broken)

---

## 🔴 4. ❗ Double guest flow risk (VERY IMPORTANT)

Abhi tum:

-   
Quizzes.tsx me guest flow bana rahe ho  

-   
SubjectContent.tsx me bhi  

-   
SyllabusBuilder me bhi  


👉 Risk: duplicate logic phir aa jayega

---

### ✅ FINAL FIX:

Create ONE function:

```

```

```
startGuestQuiz({ subjectId, topicId, count })
```

Aur har jagah use karo:

```

```

```
if (!user) return startGuestQuiz(...);
```

---

# 🟡 **Optional but HIGH IMPACT (add kar lo to product level upgrade)**

## ⭐ Progression system (tumne pehle mention kiya tha)

```

```

```
if (score >= 80) unlockNextLevel();
```

Aur:

```

```

```
store wrongQuestions → repeat later
```

&nbsp;