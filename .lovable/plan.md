

# Phase 1B: Agent Foundation — Complete Build Plan

## Overview
Build the entire agent orchestration layer: database table, two edge functions, a client library, and a unified admin dashboard that consolidates existing monitoring components.

---

## Step 1: Create `agent_tasks` Database Table

Migration SQL:

```sql
CREATE TYPE agent_task_type AS ENUM ('blog', 'mcq', 'scholarship', 'job');
CREATE TYPE agent_task_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'review');

CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type agent_task_type NOT NULL,
  status agent_task_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB,
  quality_score JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  needs_review BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority DESC);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at DESC);

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all agent tasks"
  ON agent_tasks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view agent tasks"
  ON agent_tasks FOR SELECT
  USING (is_admin());
```

---

## Step 2: Create `generate-blog` Edge Function

**File:** `supabase/functions/generate-blog/index.ts`

- Accepts `{ title, topic, keywords[], targetLength }` in request body
- Uses existing `callAIWithAutoSwitch()` from `_shared/gemini.ts`
- Prompt generates a 1200-1500 word SEO blog post with H2/H3 structure
- Saves result to `blog_posts` table with status `'draft'`
- Logs usage to `ai_usage_logs` with `source_type: 'blog_generation'`
- Updates the originating `agent_tasks` row status to `'completed'` or `'review'`
- Standard CORS headers, admin-only authorization check

---

## Step 3: Create `process-agent-tasks` Edge Function

**File:** `supabase/functions/process-agent-tasks/index.ts`

- Fetches up to 5 pending tasks ordered by priority DESC
- Dispatches each task to the appropriate existing function:
  - `blog` → invokes `generate-blog`
  - `mcq` → invokes `generate-test` with `mode: 'bank_only'`
  - `job` → invokes `fetch-external-jobs`
  - `scholarship` → logs as unsupported (future)
- Updates task status: `pending` → `processing` → `completed`/`failed`
- Handles errors: increments `retry_count`, sets `error_message`, marks `failed` after 3 retries
- Authorization: scheduled calls (service role key) or admin JWT

Register both functions in `supabase/config.toml` with `verify_jwt = false`.

---

## Step 4: Create `src/lib/agentQueue.ts` Client Library

Exports helper functions using the Supabase client:

- `createTask(type, inputData, priority?)` — inserts into `agent_tasks`
- `getTasks(filters?)` — fetches tasks with optional status/type filters
- `getTaskStats()` — returns counts by status and type
- `approveTask(id)` — sets status to `'completed'`, `needs_review` to false
- `rejectTask(id, reason)` — sets status to `'failed'` with error message
- `retryTask(id)` — resets status to `'pending'`, clears error
- `triggerProcessing()` — invokes `process-agent-tasks` edge function

---

## Step 5: Build Unified `AgentDashboard` Component

**File:** `src/components/admin/AgentDashboard.tsx`

A tabbed dashboard consolidating existing admin components:

| Tab | Content |
|-----|---------|
| **Overview** | Task stats cards (pending/processing/completed/failed counts), today's AI usage from QuotaMonitor, recent activity list |
| **Task Queue** | Table of `agent_tasks` with status badges, priority, type filters. Actions: approve, reject, retry. Button to create new task |
| **Content Gaps** | Embeds existing `EmptyTopicAnalytics` component |
| **AI Usage** | Embeds existing `QuotaMonitor` (expanded view) |
| **Review** | Embeds existing `DuplicateReviewQueue` + tasks with `needs_review = true` |

---

## Step 6: Integrate into Admin Panel

- Add "Agent" tab group in `AdminTabs.tsx` under a new group between "AI & Generation" and "External"
- Tab item: `{ value: "agent", label: "AI Agent", icon: Brain }`
- Add `<TabsContent value="agent"><AgentDashboard /></TabsContent>`

---

## Files Summary

| Action | File |
|--------|------|
| Migration | `agent_tasks` table + enum types + RLS + indexes |
| Create | `supabase/functions/generate-blog/index.ts` |
| Create | `supabase/functions/process-agent-tasks/index.ts` |
| Modify | `supabase/config.toml` — register both new functions |
| Create | `src/lib/agentQueue.ts` |
| Create | `src/components/admin/AgentDashboard.tsx` |
| Modify | `src/components/admin/AdminTabs.tsx` — add Agent tab + content |

## Credit Estimate
- ~60-80 Lovable credits total
- No new secrets needed (uses existing GEMINI_API_KEY + LOVABLE_API_KEY)

