
- Indexable /p/* slugs for the sitemap and prerender list are derived from the real quality gate (scripts/prog-seo-gate.mjs), never hand-copied — so a noindex page can never be listed in the sitemap.
- Exam page facts live in the exam_pages table; code props are fallback, a build-time snapshot (scripts/fetch-exam-facts.mjs) feeds prerender, and /exams/* sitemap entries come only from examPassesGate() — so admins edit facts without code changes and the sitemap never drifts from the gate.
