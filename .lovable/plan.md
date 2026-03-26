

# Fix: BoardTopicPage Query Matching, Debug Info, and Welcome Modal

## Problems
1. **Welcome modal appears on every page** — AIWelcome checks `sessionStorage` but shows globally on all routes including `/boards/*`, blocking content
2. **BoardTopicPage query fails to match** — `fromSlug("sindh-text-book-board")` produces "Sindh Text Book Board" but the DB name might be "Sindh Textbook Board" or similar; the `ILIKE '%...%'` with full name may not match
3. **No debug info** when queries return empty — admins can't tell which step failed

## Changes

### 1. AIWelcome — Restrict to Home/Landing Only
**File**: `src/components/AIWelcome.tsx`

- Import `useLocation` from react-router-dom
- Add a route check: only show on `/` (home page)
- If `location.pathname !== '/'`, return null immediately
- This ensures the modal never interrupts `/boards`, `/blog`, `/faq`, or any other internal page

### 2. BoardTopicPage — Improve Query Matching + Admin Debug
**File**: `src/pages/BoardTopicPage.tsx`

**Better slug-to-name matching:**
- Instead of converting slug to title case and using `ILIKE '%name%'`, split the slug into individual words and search with multiple `ILIKE` conditions
- Create a helper that converts `sindh-text-book-board` → search for rows where name ILIKE `%sindh%` AND ILIKE `%board%` (using the most distinctive words)
- Alternative simpler approach: fetch ALL educational systems (they're few) and do client-side fuzzy matching using word overlap scoring

**Concrete approach — client-side fuzzy match for systems/levels/subjects:**
- For educational_systems: fetch all active systems, then find the best match by comparing slug words against each name
- For levels: fetch all levels for the matched system, find one containing the class number
- For subjects: fetch all subjects for the matched level, fuzzy match against slug
- For topics: same pattern

**Admin debug panel:**
- Track which step failed (system/level/subject/topic) in a `debugInfo` object
- When `mcqs.length === 0` and user is admin (`useAuth` + admin check), show a collapsible debug card with:
  - Which entity was found/not found at each step
  - The slug values used
  - The resolved DB names

### 3. Add Missing Intermediate Routes (bonus)
The screenshot shows `/boards/sindh-text-book-board/class-3` which has no route — but this is a separate issue. The plan focuses on the requested fixes.

---

## Files Modified
- `src/components/AIWelcome.tsx` — add route restriction to `/` only
- `src/pages/BoardTopicPage.tsx` — rewrite query to use client-side fuzzy matching, add admin debug panel

## Technical Details

**Fuzzy matching algorithm:**
```text
slugWords = "sindh-text-book-board".split("-") → ["sindh", "text", "book", "board"]
For each DB system name, compute overlap:
  "Sindh Board" → words ["sindh", "board"] → overlap 2/4 = 0.5
  "Sindh Textbook Board" → words ["sindh", "textbook", "board"] → overlap 2/4 = 0.5
  But "textbook" contains "text" AND "book" → bonus matching
Best match wins.
```

Simpler alternative: just fetch all systems and use `name.toLowerCase().replace(/\s+/g, '-')` to convert DB name to slug, then compare slugs directly. This is the most reliable approach.

**Debug info structure:**
```typescript
{ systemFound: boolean, systemName: string | null,
  levelFound: boolean, levelName: string | null,
  subjectFound: boolean, subjectName: string | null,
  topicFound: boolean, topicName: string | null }
```

Shown in a yellow alert card only for admin users when no MCQs are found.

