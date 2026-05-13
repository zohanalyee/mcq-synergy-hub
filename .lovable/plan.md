## Goal
Fix AI Coach edge function call signature, and ensure `ResultAdviceCard` shows on `QuizPlayer` for guests (whose results render via `GuestResultGate`, not `QuizResultScreen`).

## Changes

### 1. `supabase/functions/generate-test/index.ts` (lines 1374, 1376)

The user instructed `callAIWithAutoSwitch(aiCoachPrompt)`, but the function signature is:
```ts
callAIWithAutoSwitch(systemPrompt: string, userPrompt: string, config?: GeminiConfig)
```
and it returns `{ text, provider, cost }` — no `success` field.

Proposed edit:
- L1374: `const result = await callAI(aiCoachPrompt, 'gemini');`
  → `const result = await callAIWithAutoSwitch('You are Ustaad, a desi senior student giving short personalized study advice.', aiCoachPrompt);`
- L1376: `if (result.success && result.text) {`
  → `if (result && result.text) {`

`callAIWithAutoSwitch` is already imported at line 72. No other lines change.

### 2. `src/pages/QuizPlayer.tsx`

Audit shows `QuizResultScreen` already renders `ResultAdviceCard` for logged-in users. Guests instead see `GuestResultGate` (rendered at the `if (!user)` branch around line ~245), which currently has no advice card.

To satisfy "add card after score display" while not touching guest-flow logic:
- Add import: `import ResultAdviceCard from '@/components/shared/ResultAdviceCard';`
- In the guest branch (the `<GuestResultGate ... />` block), wrap so that the advice card renders alongside the gate:
  ```tsx
  <>
    <div className="max-w-2xl mx-auto px-4 pt-6">
      <ResultAdviceCard
        score={total > 0 ? Math.round((correctCount / total) * 100) : 0}
        subject={subjectName}
        isGuest={true}
      />
    </div>
    <GuestResultGate ... />
  </>
  ```
- Variables used (verified from file): `correctCount`, `total`, `subjectName`. No `quizSubject`/`quizTopic`/`quiz` exist in this file — the user's snippet references variables that don't exist; we use the actual ones.
- Do not modify `GuestResultGate` props, `returnPath`, or any guest-session logic.

### Out of scope (untouched)
Guest flow internals, G2 lock, question bank save, guestAllowedTopicId, `bank_only` mode, `QuizResultScreen` (already has the card for logged-in users).

## Notes / Deviations from user's literal instructions
1. `callAIWithAutoSwitch` requires two string args; calling with one would be a TS error. Plan splits into a short system prompt + the existing `aiCoachPrompt` as user prompt.
2. QuizPlayer's logged-in result already renders `ResultAdviceCard` via `QuizResultScreen`. Adding a second one there would duplicate it. Plan adds the card only to the guest branch, where it's actually missing.
