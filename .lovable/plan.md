

# Hotfix — Catch Historical Hardware Terms in Cleaner

## Problem
"History of Computers" rows containing transistor / vacuum tube / ENIAC / mainframe / FORTRAN content slip past the cleaner because `HARDWARE_KEYWORDS` only lists modern parts (cpu, ram, motherboard…). Subject also doesn't contain "hardware/parts/components/architecture", so the existing branch should trigger — it just lacks the right keywords.

## Change

**File:** `src/components/admin/CorruptedDataCleaner.tsx`

1. **Expand `HARDWARE_KEYWORDS`** with historical computing hardware:
   - Modern (keep): `cpu, ram, rom, processor, motherboard, circuit, transistor, register, alu, gpu`
   - Add: `vacuum tube, valve, integrated circuit, microprocessor, eniac, univac, mainframe, minicomputer, punched card, punch card, analytical engine, difference engine, abacus, antikythera, semiconductor, microchip`
   - (`transistor` already present — keep.)

2. **Add new `PROGRAMMING_KEYWORDS` constant** (history-of-computing era):
   `fortran, cobol, algol, basic language, compiler, assembler, stored program, von neumann, grace hopper, ada lovelace, babbage, turing machine`

3. **Update Computer-branch in `getTopicMismatchReasons`**:
   - Keep science rejection unchanged.
   - Replace the hardware check with:
     ```ts
     if (!isHardwareSubject &&
         (hasAny(q, HARDWARE_KEYWORDS) || hasAny(q, PROGRAMMING_KEYWORDS)) &&
         !hasAny(q, MS_OFFICE_KEYWORDS)) {
       reasons.push("Hardware content in Computer");
     }
     ```
   - `isHardwareSubject` already covers "parts/components/architecture/hardware" — extend it to also include `"history"` so genuine "History of Computers" subjects are exempt from this rejection (history subjects legitimately discuss historical hardware). Wait — user explicitly WANTS these flagged. Keep `isHardwareSubject` unchanged so History-of-Computers rows DO get flagged.

4. **Edge-function symmetry** (`supabase/functions/generate-test/index.ts`):
   - Mirror the same expanded `HARDWARE_KEYWORDS` + new `PROGRAMMING_KEYWORDS` in the validator there so freshly generated cache rows for History-of-Computers subjects also get rejected at source. Without this, the cleaner deletes them and the next generation refills with the same junk.

## Files

| File | Action |
|---|---|
| `src/components/admin/CorruptedDataCleaner.tsx` | MODIFY — expand HARDWARE_KEYWORDS, add PROGRAMMING_KEYWORDS, update reason check |
| `supabase/functions/generate-test/index.ts` | MODIFY — mirror keyword expansion in `validateQuestionTopic` |

## Risks
- **Subjects legitimately about computing history** (e.g., a course explicitly named "Computer History 101") will be flagged. Acceptable per user's explicit instruction; if needed later, add `subject.includes("history")` to `isHardwareSubject` to exempt them.
- **Edge function double-deploy needed**; existing cleanup logic still works in the meantime.

## Verification
After deploy: Admin → Corrupted MCQ Cleanup → "Scan Again" → expect History-of-Computers rows now appear with reason "Hardware content in Computer". "Clean All" purges them; next generation runs validated edge function.

## Out of scope
- Schema changes
- New routes / UI surfaces
- Rewriting subject taxonomy

