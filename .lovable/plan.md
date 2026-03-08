

## AI-Powered Coaching Dashboard

### Current State
The Analytics page (`src/pages/Analytics.tsx`) uses **hardcoded mock data** -- no real Supabase data. Meanwhile, `useDashboardData` hook already fetches real user performance from `test_attempts` including subject performance, weaknesses, and weekly progress. The `get_student_weaknesses` RPC function exists. The recommended_tests infrastructure is already in place.

### Approach
Replace the static Analytics page with a coaching dashboard that uses **real user data** from existing hooks/tables. No new backend or edge functions needed -- all analysis logic runs client-side from existing `test_attempts` data.

### Files to Create

1. **`src/hooks/useAnalyticsData.ts`** -- Custom hook that fetches comprehensive analytics:
   - Reuses patterns from `useDashboardData` but adds: monthly performance history, per-subject topic breakdowns, weekly goal tracking
   - Queries `test_attempts` grouped by subject/topic with accuracy calculations
   - Calls existing `get_student_weaknesses` RPC

2. **`src/lib/aiCoach.ts`** -- Client-side analysis engine:
   - `analyzePerformance()` -- identifies weak subjects (<60%), declining trends, strong areas
   - `generateRecommendation(subject)` -- per-subject advice strings
   - `generateStudyPlan(analytics)` -- weekly tasks, recommended tests, goals
   - `analyzePerformanceTrend(data)` -- trend detection, anomaly finding

3. **`src/components/analytics/AIInsightsPanel.tsx`** -- Top coaching card with AI avatar, main insight text, key findings (concerns/successes), action buttons (View Recommendations, Generate Practice Test)

4. **`src/components/analytics/SubjectAnalysisCard.tsx`** -- Per-subject cards with accuracy progress bar, weak topics badges, AI recommendation text, Practice/Generate Test buttons

5. **`src/components/analytics/StudyPlanSection.tsx`** -- 3-column grid: This Week tasks (checkboxes), Recommended Tests (with Start buttons), Weekly Goals (progress bars)

6. **`src/components/analytics/TopicAnalysis.tsx`** -- Accordion per subject, each topic row shows accuracy bar, attempts count, "Needs practice" indicator, play button

7. **`src/components/analytics/QuickTestGenerator.tsx`** -- Floating action button (bottom-right), opens dialog with AI recommendation, test preview (focus areas, question count, duration), Start Now / Customize buttons

### Files to Edit

8. **`src/pages/Analytics.tsx`** -- Complete rewrite:
   - Replace hardcoded data with `useAnalyticsData` hook
   - New layout: AI Insights Panel at top → Enhanced charts (with target line, trend analysis) → Subject Analysis cards → Study Plan → Topic Drill-Down
   - Keep auth guard, add loading/empty states
   - Render `QuickTestGenerator` floating button
   - Navigation actions: Practice buttons navigate to `/custom-syllabus` or create test sessions via existing `custom_test_sessions` table

### Data Flow
```text
test_attempts table (real data)
  → useAnalyticsData hook (fetch + aggregate)
  → aiCoach.ts (analyze + generate insights)
  → UI components (render coaching dashboard)
  → User clicks "Practice" → navigates to /custom-syllabus or /test-session
```

### Key Technical Decisions
- **No new DB tables or edge functions** -- all analysis is client-side from existing `test_attempts` data
- **No AI API calls** -- the "AI Coach" is deterministic rule-based analysis (pattern matching on scores/trends), not LLM-powered. This avoids credit costs.
- Practice/Generate Test buttons will navigate to existing flows (Custom Syllabus page with pre-filled params, or create `custom_test_sessions` entries)
- Empty state when user has no test data -- shows encouragement to take first test

