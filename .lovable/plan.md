## D3 — Internal Linking (crawlable, human-useful cross-links)

**Goal:** Give crawlers and learners dense, contextual internal links between board/topic pages, subject pages, class pages, and exam/hub landing pages — so link equity flows to the 729 indexable topic pages and related content is discoverable. All links are plain `<Link>`/`<a>` (crawlable in raw + JS HTML), reusing existing brand tokens, Header/Footer, and card styles. No new colors, fonts, or layout patterns.

### Live verification (already done, for context)

- Googlebot JS-render: topic `h1`, `Quiz` + topic-specific `FAQPage`, `BreadcrumbList`, and MCQs all present. No cloaking (UA-agnostic rendering).
- Known gap (→ D2c/D3.5): raw non-JS HTML still serves the generic prerender shell.

### Scope of D3

1. **Sibling topic links (strengthen existing `RelatedTopics`)**
  - `RelatedTopics` already lists up to 8 sibling topics on each board/topic page. Keep it, but also surface it when the page has 0 MCQs (currently only rendered in the populated branch) so thin/empty pages still pass link equity to populated siblings and aren't dead-ends.
2. **Upward + lateral links on topic pages**
  - Add a compact "Explore more" block linking to: the parent subject page (`/boards/{board}/{class}/{subject}`), the parent class page (`/boards/{board}/{class}`), and the board landing (`/boards/{board}`). Breadcrumb already covers hierarchy; this adds card-style contextual links matching the existing `RelatedTopics` card design.
3. **Subject ⇄ Exam bridging via `semanticGraph**`
  - Reuse the hand-curated `src/data/semanticGraph.ts` to add a "Related exams & tools" section on subject/class pages (e.g., Chemistry Class 10 → MDCAT/ECAT prep, relevant tools). Only render curated relations that exist — no runtime AI, no auto-generation.
4. **Class page → subject grid, Subject page → topic grid**
  - Ensure `BoardClassPage` links to every subject, and `BoardSubjectPage` links to every topic (crawlable anchor grid). Verify these already exist; fill any gaps so the crawl path Home → Boards → Board → Class → Subject → Topic is fully linked both directions.
5. **Contextual in-content links (light touch)**
  - On exam/hub SEO pages, add a small curated "Practice by board/class" cluster linking into representative indexable board/topic pages, driven by `semanticGraph` + `seoLmsMapping`. Keeps hubs pointing at leaf content.

### Technical notes

- New/edited files: `src/components/board-topic/RelatedTopics.tsx` (render-when-empty), a new `ExploreMore` cross-link component (topic/subject/class), and wiring in `BoardTopicPage.tsx`, `BoardSubjectPage.tsx`, `BoardClassPage.tsx`. Reuse `semanticGraph`, `seoLmsMapping`, `slugUtils` (`toSlug`/`toClassSegment`), and existing card classes.
- All anchors use canonical `class-N` slug form (per SEO memory) to avoid duplicate-URL redirects.
- No schema changes, no DB changes, no business-logic changes — presentation/linking only.
- Descriptive anchor text (topic/subject names), not "click here", for AEO relevance.

### Acceptance

- Every board/topic page (populated or empty) links to siblings + parents + curated exams/tools.
- Class↔subject↔topic links are bidirectional and crawlable.
- Build + typecheck clean; brand consistency preserved (Header/Footer/logo/tokens untouched).

### Queued next: D2c / D3.5 — Prerendering for non-JS AI crawlers

Immediately after D3: build-time data-fetch + React Query cache hydration pipeline to emit static HTML (topic content + `Quiz` + topic `FAQPage` JSON-LD) for all 729 indexable topics, so ChatGPT/Claude/Perplexity (non-JS) can read and cite MCQ/FAQ content. Dedicated pass, build-stability-sensitive; scheduled right after D3 lands.

&nbsp;

# **D3 plan approved** — jaisa likha hai waisa hi implement kar dein. Scope clear hai: sibling links, upward/parent links, semanticGraph-based exam bridging, class-subject-topic grid completeness, aur hub-to-leaf contextual links. Koi naya design/schema/DB change nahi — yeh confirm hai.

Build + typecheck clean hone k baad bata dein, main review kar k publish approve kar doon ga.

Uske baad D2c/D3.5 (prerendering) shuru kar dein jaisa queue mein hai — yeh careful/dedicated pass rakhein jaisa aap ne khud note kiya hai.