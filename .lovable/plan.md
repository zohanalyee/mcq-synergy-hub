
## Fix: Subject Browser — Show Board & Class Context, Group by Board

### Problem
The sidebar query is:
```js
supabase.from("subjects").select("id, name")
```
This returns all subjects with just their name — "Biology" appears 7+ times with zero context. The user can't tell which board or class each belongs to.

### Root Cause
The LMS hierarchy is: `educational_systems (Board) → levels (Class) → subjects → topics`  
The current query doesn't join up to `levels` or `educational_systems`.

### Solution

**1. Update the Supabase Query** — join subjects → levels → educational_systems:
```js
supabase.from("subjects").select(`
  id, name,
  levels!level_id(
    id, name,
    educational_systems!system_id(id, name)
  )
`).eq("approved", true).order("name")
```

**2. Update `LMSSubject` interface** to hold the full context:
```ts
interface LMSSubject {
  id: string;
  name: string;
  levelName?: string;   // e.g. "Class 9"
  levelId?: string;
  systemName?: string;  // e.g. "Punjab Board"
  systemId?: string;
}
```

**3. Group subjects by Board in the sidebar UI:**

```text
BROWSE SUBJECTS
▼ Punjab Board            ← collapsible group header
   Biology  [Class 9]     ← subject row with class badge
   Physics  [Class 11]
▼ Sindh Board
   Biology  [Class 10]    ← same name, different board/class = clear!
```

- Boards are rendered as collapsible section headers (unique — no duplicates)
- Under each board, subjects show with a small "Class X" badge
- Subjects without a board/class association still show in an "Other" group

**4. Update `newConversation` context** to carry `systemName + levelName` for richer chat titles:
- Context badge in chat header: `Punjab Board · Class 9 · Biology`
- Chat title: `Ask about Biology (Punjab Board)`

### Files Changed
- `src/pages/AskDocument.tsx` — query update, interface update, sidebar render restructure

### No DB changes needed — data is already there, just not being fetched.
