# Auto-fill "No usable free Gemini key" — findings

## Short answer

Both new keys are valid and authenticating. The problem is not the keys, not caching,
and not a key-format check. Two separate things combine to make the health probe
declare every key "unusable":

1. The model names in our code are no longer available to these new keys
   (`gemini-2.0-flash` and `gemini-2.5-flash` both answer "not found"), so the code
   falls through to `gemini-flash-latest`.
2. The health probe asks for a maximum of 8 output words. `gemini-flash-latest`
   spends those on internal reasoning and returns no visible text, so the probe
   reads "empty response" and marks the key unusable — even though the key works.

Result: `usable 0/2` on every run, and auto-fill correctly (but needlessly) skips
itself to protect paid credits.

## Evidence

- Function logs, latest run (11:00 UTC): `Model gemini-2.0-flash unavailable (404)`,
  `Model gemini-2.5-flash unavailable (404)`, then
  `key #1 unusable (status 0): Gemini returned empty response`, same for key #2.
  Status `0` means no HTTP error at all — the call succeeded and came back textless.
- If the keys were wrong or stale we would see `403 / GEMINI_AUTH_ERROR`. We do not.
  Real generation calls at 10:00 UTC recorded `status: 503` for key #1 and key #2 —
  a Google "model overloaded" answer, which only a valid key can receive.
- Q1 (caching / propagation): the keys are read fresh from the environment on every
  invocation, and the functions have been redeployed since the keys were replaced.
  No stale-value path exists.
- Q3/Q4 (key format): there is no format validation anywhere in the code — no
  `AIza` prefix check, no length check. Keys are only skipped when blank. The newer
  `AQ.`-style key is therefore accepted as-is; format is not the cause.

## Proposed fix (not applied yet)

1. Refresh the model list: make `gemini-flash-latest` the primary model and keep
   `gemini-2.0-flash` / `gemini-2.5-flash` only as trailing fallbacks, so the working
   model is tried first instead of last.
2. Make the health probe realistic instead of strict: give it enough output room
   that a reasoning-capable model can answer, and treat any successful HTTP response
   as a healthy key even when the text body is empty. Only auth (401/403), quota
   (429) and hard failures should mark a key unusable.
3. Add a "no model available for this key" signal to the run log so a future model
   retirement is visible in the admin history in one line, instead of looking like a
   dead key.
4. Re-run auto-fill manually once after the change and confirm the admin history
   shows `free keys usable 2/2` and a non-zero saved count.

## Technical notes

- `supabase/functions/_shared/gemini.ts`
  - `TEXT_MODEL_FALLBACKS` / `DEFAULT_MODEL` — reorder to put `gemini-flash-latest`
    first; keep the 404-driven model rotation as-is.
  - `callGeminiTextOnce` — an empty `extractText(data)` currently throws
    `"Gemini returned empty response"`; keep that for real generation, but the probe
    must not treat it as key failure.
  - `probeFreeGeminiKeys` — raise `maxOutputTokens` from 8 to a workable value and
    classify outcomes by HTTP status rather than by presence of text.
- `supabase/functions/scheduled-autofill/index.ts` — unchanged logic; it simply
  reports `keyHealth.usable`, which becomes correct once the probe is fixed.
- No database or UI change required. No secret change required — do not replace the
  keys again.
