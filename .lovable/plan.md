# Unify Mock Tests + Definitions into One Editor

## Goal

There will be exactly ONE place to create/edit a mock test. Opening a mock test for edit shows everything in tabs — Basic Info, Syllabus, Samples, Questions, Logs — with no separate "Job Test Definitions" panel and no "link/create" indirection.

## Current state (confirmed)

- The admin "Mock Tests" tab (`AdminTabs.tsx` → `JobTestManager`) currently shows TWO sections: an "Isolated System" list of `job_test_definitions` (editable via `JobTestDefinitionEditor` with the 5 tabs) and a "Legacy Job Tests" table of `job_tests` (edited via the basic `AddJobTestDialog`).
- `job_tests.definition_id` already exists as the link column, but only 1 of 30 tests is linked.
- The rich data lives in `job_test_definitions` + `job_test_questions` (questions are keyed by `job_test_id = definition.id`).
- Two real definitions exist:
  - **Junior Clerk (BPS-11)** — `ef50cfc9…` — 4 syllabus sections, 90 questions, published.
  - **Teaching License Test** — `e6d6b6a3…` — 5 sections, 100 questions, published.
  - Plus 3 empty "New Job Test" drafts and 1 "Secondary School Teachers (SST)" draft (already linked, empty).

## Target design

Every `job_tests` row is backed by exactly one `job_test_definitions` row (1:1 via `definition_id`). The mock test editor becomes a single tabbed surface:

```text
Edit Mock Test: "Junior Clerk (BPS-11)"
┌───────────────────────────────────────────────┐
│ [Basic Info] [Syllabus] [Samples] [Questions] [Logs] │
├───────────────────────────────────────────────┤
│ Basic Info: title, description, organization,   │
│   duration, # questions, weighted syllabus list │
│ Syllabus/Samples/Questions/Logs: the existing   │
│   JobTestDefinitionEditor tab content, inline    │
└───────────────────────────────────────────────┘
```

When an admin opens (or creates) a mock test:

1. If the test has no `definition_id`, one is auto-created on first save (or lazily on open) and linked — invisible to the admin; no "skip/link/create" choice.
2. The same dialog renders Basic Info plus the embedded definition tabs, both saving to their respective tables on Save.

## Implementation

### 1. New unified editor component

Create `src/components/admin/job-test/MockTestEditor.tsx` that replaces `AddJobTestDialog` + `DefinitionLinkField`. It hosts a `Tabs` with:

- **Basic Info** tab: the existing fields from `AddJobTestDialog` (title/description/organization/duration/questions + `SyllabusItemForm`), saving to `job_tests`.
- **Syllabus / Samples / Questions / Logs** tabs: reuse the existing tab bodies extracted from `JobTestDefinitionEditor` (syllabus section editor, `SampleQuestionsEditor`, `GeneratedQuestionsTable`, `GenerationLogsTable`), operating on the backing definition.

To avoid duplicating logic, refactor `JobTestDefinitionEditor` so its tab bodies can be reused (export the inner editor or split into `DefinitionTabs` that takes a `definition` + `onChange`). The unified editor manages one `definition` object and one `job_tests` object together.

Save behavior: "Save" persists both — `updateJobTest`/`addJobTest` for the row and `upsertJobTestDefinition` for the definition — and ensures `definition_id` is set. Creating a brand-new mock test auto-creates the definition (titled from the test title) and links it in the same flow.

### 2. Simplify `JobTestManager`

- Remove the entire "Job Test Definitions (Isolated System)" section and the `editing`/`createBlank`/`loadDefinitions` definition-list state.
- Keep one section: the mock tests table (`JobTestTable`) + "Add Mock Test" + bulk import + "Run AI Magic on All".
- "Add" and the table's Edit action both open the new `MockTestEditor`.

### 3. Simplify the hook

In `useJobTestManagement.tsx`, remove the `definitionMode`/`definitionId`/`newDefinitionTitle`/`resolveDefinitionId` link-mode machinery. On edit, load the linked definition (via `findDefinitionForTest`); on save, upsert the definition and persist `definition_id`. On create, auto-create + link the definition.

### 4. Remove now-dead pieces

- Delete `src/components/admin/job-test/DefinitionLinkField.tsx`.
- Drop the "Linked" badge from `JobTestTable` (every test is backed by a definition now; the badge is meaningless) — optionally replace with a "Questions: N" count.
- `JobTestDefinitionEditor.tsx` stays only if reused for its tab bodies; otherwise its standalone shell is removed.

### 5. Data migration (no data loss — relocate/link only)

Backfill `job_tests.definition_id` so the rich data surfaces in the unified editor:

- Link **Junior Clerk (BPS-11)** definition → the canonical "Junior Clerk (BPS-11)" `job_tests` row (two rows share this title; link the primary and leave the duplicate unlinked or flag for cleanup — see Open Question).
- Link **Teaching License Test** definition → the matching Sindh Teaching License Exam row (see Open Question for Elementary vs Secondary).
- For every other `job_tests` row with no `definition_id`, create a minimal backing definition (carrying over the row's weighted syllabus items into `syllabus.sections`) and link it, so the unified tabs are populated and ready for sample/question authoring.
- Clean up the 3 empty "New Job Test" drafts.

This is done via a one-time SQL migration/data update; existing `job_test_questions` stay attached to their definition IDs and now appear under the linked test's Questions tab.

### 6. Public side unchanged

`/mock-tests` keeps reading `job_tests`; `getMockTestPreviewQuestions`/`findDefinitionForTest` already resolve questions through `definition_id`, so linking makes the rich question pools flow to the public pages automatically.

## Open questions to confirm before migration

1. **Teaching License Test** (5 sections, 100 Qs) — link it to the **Elementary** or **Secondary** School Teacher mock test? (The Secondary row is currently linked to a separate empty "SST" draft — I'd repoint it.)
2. **Junior Clerk (BPS-11)** appears as two `job_tests` rows — keep both (link one, leave/delete the duplicate) or merge into one?

## Files touched

- Add: `src/components/admin/job-test/MockTestEditor.tsx` (+ possibly `DefinitionTabs.tsx`)
- Edit: `JobTestManager.tsx`, `useJobTestManagement.tsx`, `JobTestDefinitionEditor.tsx` (refactor for reuse), `JobTestTable.tsx`
- Delete: `DefinitionLinkField.tsx`, `AddJobTestDialog.tsx` (superseded)
- Migration: backfill `definition_id`, create backing definitions, cleanup empty drafts

&nbsp;

&nbsp;

# **Updated decisions for the migration:**

&nbsp;

1. Teaching License Test definition → link to the "Sindh Teaching 

   License Exam (Secondary School Teacher)" mock test.

&nbsp;

2. Junior Clerk duplicates: Don't try to figure out which is 

   "correct" — instead, DELETE both existing Junior Clerk Definitions 

   AND don't worry about linking them. I will re-upload a fresh 

   Junior Clerk definition via JSON bulk import myself afterward, 

   through the new unified editor.

&nbsp;

3. GENERAL APPROACH for migration: Rather than trying to carefully 

   preserve/link the 2 existing definitions, please:

   - Delete the existing job_test_definitions entirely (Junior Clerk, 

     Teaching License Test, and the empty drafts) — I will re-create 

     them fresh via JSON upload in the new unified editor once it's 

     built.

   - For the "duplicate" Junior Clerk job_tests rows, please tell 

     me which one to keep/delete based on which has more complete/

     correct data (organization, syllabus) — show me both so I can 

     make the final call before deletion.

   - Proceed with building the unified MockTestEditor as planned 

     (Basic Info + Syllabus + Samples + Questions + Logs in one 

     place), with auto-create-definition-on-save for any test that 

     doesn't have one.

&nbsp;

This simplifies the migration — less manual linking, I'll repopulate 

the rich data fresh via JSON once the new unified editor exists.

ADDITIONAL REQUIREMENT for the unified editor:

Currently, I had to upload TWO separate JSON files — one for the 

mock test (Basic Info) and one for the Definition (syllabus/samples/

questions). 

In the new unified MockTestEditor, I want ONE combined JSON bulk 

import that handles everything together — basic info (title, 

organization, duration, questions count) AND syllabus sections/

samples/questions all in a single JSON file/structure.

Please:

1. Design a single unified JSON schema that combines both the 

   Basic Info fields and the Definition fields (syllabus sections, 

   samples, questions) into one structure

2. The "Bulk Import JSON" button on the unified editor should accept 

   this single combined file and populate ALL tabs (Basic Info, 

   Syllabus, Samples, Questions) from it in one upload

3. Also update "Export JSON" to export this same combined structure, 

   so I can use an exported test as a template for new ones

4. Show me the expected JSON structure/schema before implementing, 

   so I know exactly what format to prepare my data in going forward

This removes the need for two separate uploads — one JSON file per 

mock test, covering everything.