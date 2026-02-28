

# Plan: Improve MCQ Extraction Prompt

## Single File Change: `supabase/functions/convert-document-mcqs/index.ts`

### Change 1: Replace systemPrompt (lines 118-184)
Replace with enhanced prompt that:
- Strongly emphasizes extracting ALL questions (repeated instructions)
- Explicitly handles answer keys at document end
- Handles page breaks and split questions
- Includes extraction example for answer key matching
- Adds `has_answer_key` to metadata output

### Change 2: Replace userPrompt (line 186)
New prompt that:
- Warns document may have 20-50+ questions
- Instructs to check for answer keys
- Reminds not to stop early

### Change 3: Add extraction validation logging (after line 249)
- Log warning if few questions extracted from large text
- Compare question count vs text line count as sanity check

### Change 4: Increase max_tokens (line 203)
- Change from `16384` to `32768` to handle larger question sets without truncation

No other files need changes. Deploy after edit.

