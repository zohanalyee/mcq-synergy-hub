
- Indexable /p/* slugs for the sitemap and prerender list are derived from the real quality gate (scripts/prog-seo-gate.mjs), never hand-copied — so a noindex page can never be listed in the sitemap.
- Exam page facts live in the exam_pages table; code props are fallback, a build-time snapshot (scripts/fetch-exam-facts.mjs) feeds prerender, and /exams/* sitemap entries come only from examPassesGate() — so admins edit facts without code changes and the sitemap never drifts from the gate.

- Legacy /subject/<uuid> and /subject-content/<uuid> heads are written at build time by scripts/inject-meta.mjs (canonical → indexable board subject hub, else self), and GlobalCanonical skips those paths — so Google never sees them as homepage duplicates and the browser does not override the build canonical.
- Board topic internal links (prev/next, sibling window, hub link) come only from src/lib/topicLinkGraph.js over src/generated/topicOrder.json (indexable topics, curriculum order, built by scripts/build-topic-order.mjs) — so static HTML and the client page always emit identical, deterministic links.
- Build scripts must page every Supabase table read with .range() (1000-row cap) and fail the build if an indexable topic path has no topic_id — truncated maps silently stripped static content from 158 pages.
- STHP apply/test date wording on the mock-test page (client + prerender) comes only from src/lib/sthpStatus.js over the exam_pages "sthp" snapshot — so admins change dates without code edits and wording auto-switches after test day.
