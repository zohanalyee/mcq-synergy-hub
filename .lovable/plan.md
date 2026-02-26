

# Plan: Smart Auto-Generation System (Consolidation, Not Rebuild)

## Key Finding

After thorough codebase review, **most of what you're requesting already exists**:

- `AutoFillDashboard` -- quota monitoring, enable/disable toggle, manual run, settings
- `ContentGapQueue` -- priority queue with Auto-Pilot (continuous loop with stop button)
- `AutoFillSettings` -- batch size, thresholds, difficulty weights, daily limits
- `scheduled-autofill` edge function -- background worker with quota checks, RAG-first priority
- `autoFillService.ts` -- `generateForTopic()`, quota checking, queue fetching
- `QuotaMonitor` -- real-time AI usage display
- `ai_usage_logs` table -- tracks all AI usage
- `system_settings` table -- stores auto-fill config, limits, thresholds

The 80% quota protection, prioritized queue, and zero-intervention auto-fill already work. What's needed is **consolidation and cleanup**, not a full rebuild with new tables and edge functions.

---

## What This Plan Actually Does

1. Strip generation buttons from Content Inventory (make it view-only statistics)
2. Promote the existing Auto-Fill Dashboard into a top-level admin tab called "Smart Generation"
3. Remove redundant/duplicate tabs

---

## Part 1: Make Content Inventory View-Only

**File: `src/components/admin/analytics/ContentInventory.tsx`**

Remove:
- `handleGenerate` function (lines 121-156)
- `handleBulkGenerate` function (lines 158-201)
- `generating` and `bulkGenerating` state variables
- "Actions" column from the table
- Bulk action buttons at the bottom
- `Sparkles` icon import (no longer needed)

The component becomes a pure read-only statistics dashboard with filters and summary cards.

---

## Part 2: Add "Smart Generation" Tab to AdminTabs

**File: `src/components/admin/AdminTabs.tsx`**

Changes:
- Import `AutoFillDashboard` from `./auto-fill/AutoFillDashboard`
- Add a new `TabsTrigger` for `"smart-generation"` with a Zap icon, placed after "Generate MCQs"
- Add corresponding `TabsContent` rendering `AutoFillDashboard`
- Rename the "Inventory" tab label from "Content Inventory" references to just "Inventory" (it's already labeled "Inventory" in the tab trigger, just update the header text in ContentInventory.tsx)

This gives the existing Auto-Fill Dashboard (with its quota monitor, auto-pilot, priority queue, settings, and manual run) a prominent top-level tab instead of being buried.

---

## Part 3: Update ContentInventory Header

**File: `src/components/admin/analytics/ContentInventory.tsx`**

Change the header text from "Content Inventory" to "Inventory" and update the description to emphasize it's a view-only statistics dashboard. Remove the subtitle about "smart linking" since that's now implicit.

---

## Technical Details

### Files Modified

| File | Change |
|---|---|
| `src/components/admin/analytics/ContentInventory.tsx` | Remove generate functions, bulk actions, make view-only |
| `src/components/admin/AdminTabs.tsx` | Add "Smart Generation" tab pointing to AutoFillDashboard |

### No New Files Needed

The existing `AutoFillDashboard`, `ContentGapQueue`, `AutoFillSettings`, and `scheduled-autofill` edge function already implement the complete smart generation system with:
- Quota monitoring and 80% safety buffer (configurable via settings)
- Auto-Pilot mode (continuous loop with stop button)
- Priority queue (lowest-first or random)
- RAG-first generation strategy
- Difficulty weight distribution
- Manual run trigger
- Enable/disable toggle
- Backfill utilities

### No Database Migration Needed

Existing tables (`ai_usage_logs`, `system_settings`) and RPCs (`get_autofill_queue`, `get_ai_usage_today`) already cover all requirements. Creating new `api_usage_logs` or `auto_generation_queue` tables would duplicate existing infrastructure.

### Implementation Order

1. Strip generation functions from ContentInventory
2. Add Smart Generation tab to AdminTabs
3. Update ContentInventory header text

