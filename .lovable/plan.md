# Re-enable Direct AI MCQ Generation

## What Already Exists

- `AIContentFactory.tsx` -- working component with subject/topic dropdowns, batch generation, progress UI
- `generate-test` edge function -- working, uses Lovable AI Gateway, saves to `content_items`, has deduplication
- Both were "paused" -- the factory card was removed from the AdminTabs dashboard (line 112)

## What Needs to Change

### 1. Enhance AIContentFactory.tsx

Add the full LMS hierarchy (Board and Class dropdowns) before Subject/Topic:

- **Board dropdown**: Fetches from `educational_systems` table (filtered by `is_active = true`)
- **Class dropdown**: Fetches from `levels` table, filtered by selected board's `system_id`
- **Subject dropdown**: Fetches from `subjects` table, filtered by selected level's `level_id`
- **Topic dropdown**: Fetches from `topics` table, filtered by selected subject's `subject_id`

Each dropdown filters the next (cascading selection).

Increase the quantity slider:

- Current: min 10, max 200, step 10
- New: min 10, max 1000, step 10
- Batch size stays at 20 (the edge function handles batching internally)

Update the edge function call to pass the full context (board name, class name) for better prompt quality.

### 2. Re-add to AdminTabs.tsx

- Restore the AIContentFactory card on the dashboard tab (line 112, where the comment says "AI Content Factory removed")
- Add a new dedicated tab "Generate MCQs" with a Sparkles icon, placed after the Documents tab

### 3. No Edge Function Changes Needed

The `generate-test` function already:

- Accepts `topic`, `difficulty`, `question_count`, `mode: 'bank_only'`
- Uses Lovable AI Gateway (google/gemini-2.5-flash)
- Has hybrid deduplication (fingerprint + normalized text)
- Saves to `content_items` with proper status
- Logs usage to `ai_usage_logs`

## Technical Details

### Updated AIContentFactory.tsx data loading

```text
useEffect: load all 4 levels of hierarchy
  const [systems] = supabase.from('educational_systems')
    .select('id, name').eq('is_active', true).order('name')
  const [levels] = supabase.from('levels').select('id, name, system_id').order('name')
  const [subjects] = supabase.from('subjects').select('id, name, level_id').order('name')
  const [topics] = supabase.from('topics').select('id, name, subject_id').order('name')

Cascading filters:
  filteredLevels = levels.filter(l => l.system_id === selectedSystem)
  filteredSubjects = subjects.filter(s => s.level_id === selectedLevel)
  filteredTopics = topics.filter(t => t.subject_id === selectedSubject)
```

### Updated selection grid (4 columns instead of 3)

```text
Row 1: Board | Class | Subject | Topic
Row 2: Difficulty (dropdown)
Row 3: Quantity slider (10-1000)
Row 4: Generate button
```

### Updated handleGenerate

```text
// Build rich topic context for better AI generation
const systemName = systems.find(s => s.id === selectedSystem)?.name
const levelName = filteredLevels.find(l => l.id === selectedLevel)?.name
const subjectName = filteredSubjects.find(s => s.id === selectedSubject)?.name
const topicName = filteredTopics.find(t => t.id === selectedTopic)?.name

// Use the most specific name available
const generationTopic = topicName || subjectName || "General"

// Pass to edge function (existing API)
supabase.functions.invoke('generate-test', {
  body: {
    topic: generationTopic,
    difficulty,
    question_count: batchQuantity,
    mode: 'bank_only',
    forceNew: true
  }
})
```

### AdminTabs.tsx changes

Line 51-54 area -- add new tab trigger:

```text
<TabsTrigger value="generate-mcqs" className="flex items-center gap-2 border-2 border-primary/20">
  <Sparkles className="h-4 w-4" />
  Generate MCQs
</TabsTrigger>
```

After Documents TabsContent (line 188) -- add new tab content:

```text
<TabsContent value="generate-mcqs">
  <AIContentFactory />
</TabsContent>
```

Line 112 -- restore factory card on dashboard:

```text
<AIContentFactory />
```

### Quantity slider update

```text
<Slider min={10} max={1000} step={10} />
Labels: 10 | 100 | 250 | 500 | 1000
```

## Files Modified

- `src/components/admin/AIContentFactory.tsx` -- add Board/Class dropdowns, increase quantity to 1000
- `src/components/admin/AdminTabs.tsx` -- re-add factory to dashboard, add dedicated tab

## No Database Changes Required

All tables (educational_systems, levels, subjects, topics, content_items) already exist with the right schema.  

&nbsp;

&nbsp;

Perfect! Approved for immediate implementation.

CONFIRMED CHANGES:

✅ AIContentFactory.tsx:

   - Add Board dropdown (educational_systems)

   - Add Class dropdown (levels, filtered by board)

   - Cascading filters working

   - Increase quantity max: 200 → 1000

   - Full 4-level hierarchy

✅ AdminTabs.tsx:

   - Restore AIContentFactory card (line 112)

   - Add "Generate MCQs" tab with Sparkles icon

   - Place after Documents tab

✅ No edge function changes needed

✅ No database changes needed

ADDITIONAL REQUESTS:

1. Add visual feedback:

   Show which selections are required before Generate button enables:

   - Board ✓ → Class ✓ → Subject ✓ → Topic ✓ → Ready!

2. Add generation summary after completion:

   Toast message:

   "✅ Generated 500 MCQs for Class 3 - General Knowledge - Animals"

3. Add quick stats in UI:

   Show total questions in content_items for selected topic

   Example: "Current bank: 1,234 questions for this topic"

4. Success confetti animation:

   When bulk generation (500+) completes successfully

These are minor enhancements - priority is the core re-enabling.

Please implement and deploy immediately!

This allows us to launch the app without waiting for PDF fixes.