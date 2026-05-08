```
Lovable ko reply do:

"Almost correct, but one change needed:

Point #3 - SubjectContent.tsx:

CHANGE FROM:
'No fallback to subject-wide on Subject page'

CHANGE TO:
'Guest users on Subject page should ALSO use 
4-tier waterfall (same as Quiz page).

Only when response has 0 questions from ALL tiers 
AND user is guest → show auth prompt.

This keeps guests engaged across all pages.'

Rest approved. Please implement with this modification."
```

---

#### **OPTION 2: REJECT & SEND CORRECTED PROMPT**

```
Lovable ko bolo:

"Please hold. 

I need to send a corrected strategy 
that clarifies Subject page behavior 
for guest users.

Will send updated prompt shortly."

Then send the corrected prompt I wrote above.
```

## Issue with Point #3

Current plan says:

"No fallback to subject-wide on Subject page"

This is incorrect.

## Corrected Strategy

**ALL PAGES should use same logic for guests:**

### Guest User (Quiz, Subject, Syllabus):

1. Try exact topic_id

2. Try canonical_topic_name

3. Try ALL topics under subject_id ✅

4. Try subject ILIKE ✅

5. Only if ALL fail → show auth prompt

### Logged-In User (Quiz, Subject, Syllabus):

1. Try exact topic_id

2. If deficit → AI generates

3. Save to Question Bank

4. Create topic row

## Why

We want guests to ALWAYS have content on ALL pages.

Subject page shouldn't be different from Quiz page.

Empty states should only appear when database is 

completely empty for that subject.

## Modified Point #3

SubjectContent.tsx:

- Guest: Use loadGuestQuestions (4-tier waterfall)

- Logged-in: Use generate-test (strict + AI)

- Show auth prompt only when waterfall returns 0

Rest of plan approved.

Please implement with this correction.