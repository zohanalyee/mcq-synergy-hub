# Fix: Same topic + subject should share questions across all boards

## What's happening (confirmed from the database)

Your "Acids, Bases and Salts" topic exists under many boards. I queried the DB and the questions **are** being saved — but each board keeps its own private copy and none of them share, so most boards still show `0 / Empty`.

Example rows found in `content_items`:

```text
topic                              canonical_topic_name                     topic_id   count
Acids, Bases and Salts (Chemistry) acids-bases-and-salts-chemistry          f4bf…      20
Acids, Bases and Salts (Chemistry) acids-bases-and-salts-chemistry          ee9c…      18
Acids, Bases and Salts (Chemistry) acids-bases-and-salts-chemistry          d9e3…      14
Acids, Bases and Salts (Science)   acids-bases-and-salts-science-           3979…      10
Acids, Bases and Salts (Gen.Sci)   acids-bases-and-salts-general-science    aeb1…      13
```

There are **three independent bugs** that together break cross-board sharing:

1. **Content Health writes a polluted canonical key.** It sends `topic: "Acids, Bases and Salts (Chemistry)"` to `generate-test`, so the canonical becomes `acids-bases-and-salts-chemistry` (and sometimes `…-science-` with stray dashes). The `topic`/`subject` columns are also filled with this wrong value.

2. **The reader looks for a *different, clean* key.** `BoardTopicPage` matches `canonical_topic_name = toSlug(topicName)` → `acids-bases-and-salts` (no subject suffix). It never equals the polluted stored value, so canonical sharing silently fails and only the exact `topic_id` match works.

3. **The health RPC ignores canonical matches whenever a row already has a `topic_id`.** `get_content_health` only counts canonical matches `WHEN ci.topic_id IS NULL`. Since every filled row *does* have a `topic_id` (from its origin board), sibling boards can never "see" those questions → they stay `Empty`.

Net effect: filling one board never helps the identical topic on other boards.

## The fix — one shared canonical key everywhere

Adopt a single, consistent canonical key of **`slug(subject) + "-" + slug(topic)`** (subject-scoped, so "Acids, Bases and Salts" in *Chemistry* and in *General Science* stay separate, but the same subject+topic is shared across every board). Every write, every read, and the health count must compute it the same way.

### 1. Writer — `src/components/admin/ContentHealthDashboard.tsx`
- Stop concatenating the subject into `topic`. Pass clean values:
  - `topic: row.topic_name` (not `"${topic_name} (${subject_name})"`)
  - `subject: row.subject_name`
  - `client_canonical_topic_name: slug(row.subject_name) + '-' + slug(row.topic_name)`
- Keep sending `topic_id` (still needed for the origin board's inventory).

### 2. Writer — `supabase/functions/generate-test/index.ts`
- Ensure `resolvedCanonicalTopicName` prefers `client_canonical_topic_name` (already does) and, when deriving its own, uses `slug(subject)-slug(topic)` instead of `slug(topic)` only, so ad-hoc/AIContentFactory generations produce the same key.
- Store `subject` = real subject name and `topic` = real topic name (no `(Subject)` suffix).

### 3. Reader — `src/pages/BoardTopicPage.tsx`
- Change the canonical used in the MCQ query from `toSlug(topicName)` to `toSlug(subject.name) + '-' + toSlug(topicName)` so it matches the new unified key. Keep the `topic_id.eq.X OR canonical_topic_name.eq.Y` structure so both direct and shared matches work.

### 4. Health RPC — `get_content_health` (migration)
- In the `topic_counts` CTE, change the canonical branch from
  `ci.topic_id IS NULL AND ci.canonical_topic_name = slug(topic_name)`
  to also count rows that have a `topic_id` and match the subject+topic canonical:
  `ci.canonical_topic_name = slug(subject_name) || '-' || slug(topic_name)`
  (drop the `topic_id IS NULL` restriction). This makes filled sibling boards show as `filled` too.

### 5. Backfill migration (one-time data repair)
- Recompute `canonical_topic_name` for existing `mcq` rows using the real subject+topic from the linked `topics`/`subjects` (via `topic_id`), and repair the `topic`/`subject` columns that were stored as `"Name (Subject)"`. Rows without a resolvable `topic_id` fall back to stripping a trailing ` (…)` from the current `topic`.

## Result
- Fill a topic once on any board → the same subject+topic instantly shows as filled and serves those MCQs on **every** board that has it.
- Content Health stops showing dozens of duplicate `Empty` rows for the same subject+topic across boards.
- Existing 100+ already-generated questions become visible everywhere after the backfill.

## Technical notes / risks
- Subject-scoped key (not topic-only) is intentional per your note that "subjects can be different" — it prevents e.g. *General Science* answers leaking into *Chemistry* pages while still sharing across boards.
- Backfill is idempotent (recomputes deterministically); safe to re-run.
- No schema/column changes — only the RPC body, a data backfill, and app/edge code.
- Minor follow-up: `AIContentFactory` bank-count stat uses `ilike('topic', name)`; it will read correctly once the `topic` column is repaired.
