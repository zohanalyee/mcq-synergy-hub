## Sidebar Navigation UI/UX Polish

Refine `src/components/AppSidebar.tsx` with three targeted improvements: distinct icons, colored hover states, and a dynamic copyright year.

---

### 1. Fix Duplicate Icons & Colors

Update the `getIcon` map in `AppSidebar.tsx`:

- **`/recruitment-tests`** (currently `FileSignature`, orange): change icon to `BriefcaseBusiness` and keep a deep-orange tone (`text-orange-600`) — distinct from Jobs (teal) and Past Papers (amber).
- **`/ask-docs`** (currently `BotMessageSquare`, emerald — duplicates Recruitment's old `FileSignature` shape concern): change icon to `Bot` with `text-amber-500` for a vibrant yellow/amber.

Add the new imports (`BriefcaseBusiness`, `Bot`) to the existing `lucide-react` import line and remove `FileSignature` / `BotMessageSquare` if no longer used elsewhere in the file.

---

### 2. Premium Colored Hover Effects

Each route already has an associated color in the `getIcon` map. Extend that map so each entry returns both an `icon` and a `hoverClass` (e.g., `hover:bg-blue-500/10 hover:text-blue-600`). Apply on the `SidebarMenuButton` per item.

Mapping (matches existing icon colors):

| Route | Hover tint |
|---|---|
| `/` | `hover:bg-blue-500/10` |
| `/subjects` | `hover:bg-purple-500/10` |
| `/quizzes` | `hover:bg-red-500/10` |
| `/recruitment-tests` | `hover:bg-orange-500/10` |
| `/custom-syllabus` | `hover:bg-indigo-500/10` |
| `/scholarships` | `hover:bg-pink-500/10` |
| `/jobs` | `hover:bg-teal-500/10` |
| `/past-papers` | `hover:bg-amber-500/10` |
| `/tools` | `hover:bg-indigo-400/10` |
| `/analytics`, `/ai-coach` | `hover:bg-cyan-500/10` |
| `/feedback` | `hover:bg-lime-500/10` |
| `/question-bank` | `hover:bg-violet-500/10` |
| `/ask-docs` | `hover:bg-amber-500/10` |

The active state styling (`bg-primary/10`) is preserved and takes precedence visually when a route is active. The existing `hover:scale-[1.02]` and transition timing remain untouched so motion feel is consistent.

---

### 3. Dynamic Copyright Year

In the `SidebarFooter`, replace the hardcoded `© 2025 MCQSAI` with `© {new Date().getFullYear()} MCQSAI` so it auto-updates each year.

---

### Files Touched

- `src/components/AppSidebar.tsx` (only file)

No changes to routing, sidebar collapse behavior, badges, or the `Sidebar` shell — strictly visual polish on the items themselves.
