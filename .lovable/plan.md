## Report: Board-topic indexing investigation

### Robots.txt (confirmed, no change)

No legitimate pages are blocked. The 324 "Blocked by robots.txt" are intentional query-param duplicates (`?count=`, `?timed=`, `?topic=`, `?difficulty=`, `?q=`, `?lang=`, `/subjects?*`). Board topic paths, sitemap URLs, and all clean canonical routes are reachable — verified via GSC URL Inspection. Leaving as-is per your decision.

### Root cause of the indexing gap

The cross-board sharing fix updated the **writer** (`generate-test`), the **reader** (`BoardTopicPage`), and `get_content_health` to the unified canonical key `slug(subject)-slug(topic)`. But the RPC that drives the sitemap **and** the SSR noindex manifest — `get_indexable_board_topic_paths` — was **never updated**. It still:

1. Uses the OLD canonical key `slug(topic)` (no subject prefix), so it never matches the newly stored `slug(subject)-slug(topic)` values.
2. Restricts canonical matching to `ci.topic_id IS NULL`, so shared-bank rows that have a `topic_id` are invisible to sibling boards.

This is the identical bug already fixed in `get_content_health`. Result: pages filled via the shared bank stay marked thin → `<meta robots=noindex>` in SSR HTML AND excluded from the sitemap.

### Answers to your 4 questions (live DB data)

1. **The "Discovered – currently not indexed" pages are NOT the 0-question noindex ones.** Noindex pages report as "Excluded by noindex tag". "Discovered – currently not indexed" means Google found the URL (via sitemap) but hasn't prioritized crawling it. I confirmed this by inspecting an in-manifest, genuinely-indexable topic (`.../biology/biotechnology`) — it shows exactly this state. It's a crawl-priority/site-authority signal, made worse by the sitemap under-listing good pages.
2. **Indexable board topics with 5+ questions:**
  - Currently shipped manifest: **477 paths**
  - Old RPC logic: **494**
  - Corrected shared-canonical logic: **729**  → **254 newly indexable** via the shared bank that the current RPC/manifest wrongly excludes.
3. **Crawl budget is NOT being wasted by thin pages.** Distribution: 653 zero-question + 8 thin (1–4 Qs) = 661 thin topics, all correctly `noindex` and excluded from the sitemap. The real problem is the inverse — **254 good pages are wrongly hidden** from Google, not a thin-page flood.
4. **The manifest (`indexableTopics.json`) is stale/incorrect.** It holds 477 paths vs 729 truly indexable. Root cause is the un-updated RPC above; it's regenerated at build time (`prebuild` → `generate-sitemaps.mjs`) from that RPC, so fixing the RPC + rebuilding fixes both the sitemap and the SSR noindex tags.

---

## Proposed fix

### 1. Migration — update `get_indexable_board_topic_paths`

Bring it in line with `get_content_health`:

- Change the canonical match from `ci.canonical_topic_name = slug(topic_name)` to `ci.canonical_topic_name = slug(subject_name) || '-' || slug(topic_name)`.
- Drop the `ci.topic_id IS NULL AND` guard so shared-bank rows with a `topic_id` count on every sibling board.
- Keep the `>= 5 approved MCQs` threshold and the SECURITY DEFINER / path-only output unchanged.

### 2. Regenerate the manifest + sitemap

Run `node scripts/generate-sitemaps.mjs` so `src/generated/indexableTopics.json` grows from 477 → ~729 paths and the board sitemaps refresh. This flips SSR `noindex` off for the 254 newly-qualifying topics and adds them to the sitemap.

### 3. Verify

- Re-run the corrected count query to confirm 729 indexable.
- Spot-check that a previously-thin, now-shared topic no longer carries `noindex` and appears in `boards-*.xml`.

### Expected outcome

~254 legitimate board-topic pages stop emitting `noindex` and enter the sitemap, so Google can index the content that already exists via the shared bank. No robots.txt change; no schema change.

&nbsp;

&nbsp;

# **Approved — please implement the proposed fix immediately:**

1. Migration: Update get_indexable_board_topic_paths RPC to 

   use the unified slug(subject)-slug(topic) canonical key 

   and drop the topic_id IS NULL restriction — exactly as 

   you've described, mirroring the fix already applied to 

   get_content_health.

2. After migration: Run node scripts/generate-sitemaps.mjs 

   to regenerate indexableTopics.json (477 → ~729 paths) 

   and refresh the board sitemaps.

3. Verify: Confirm count reaches ~729 indexable topics, and 

   spot-check that a previously-excluded shared-bank topic 

   no longer has noindex in SSR HTML and appears in 

   boards-*.xml.

This is high priority — 254 legitimate pages with real 

content are currently invisible to Google solely because 

of a missed RPC update. Fixing this is the single highest-

impact action for our indexing recovery right now.