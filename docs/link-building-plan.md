# Real Link-Building Plan — mcqsai.com

Status: PLAN ONLY (no outreach or code executed). Written 8 Aug 2026.
Context: Semrush Authority Score 2/100, ~11 referring domains (10 spam, now disavowed),
only ~4 follow links. The problem is *zero authority*, not toxicity. Target for the next
90 days: 25–35 genuine referring domains, all editorially placed or legitimately listed.

Rules applied to every tactic below:
- No paid links, no PBNs, no link-shortener/"free backlink" sites (that is exactly what we
  just disavowed).
- No exact-match anchor spam. Anchors should read naturally: "MCQsAI", "mcqsai.com",
  "free MDCAT MCQs", "9th class MCQs practice".
- Every link must point to a page that genuinely answers the referring page's promise
  (deep links > homepage links).

---

## Tier 1 — Directory & listing links (fast, low effort, foundational)

Purpose: establish entity/NAP consistency and get the first non-spam referring domains.

| Target | Type | Landing page to submit | Notes |
| --- | --- | --- | --- |
| Google Business Profile (service-area, no address) | Entity | `/` | Also strengthens brand SERP |
| Bing Places | Entity | `/` | Mirrors GBP data |
| Crunchbase / company profile | Entity | `/about` | Add founding info + description |
| Product Hunt (launch "AI MCQ practice for Pakistani exams") | Launch | `/get-started` | One-shot, plan the launch day |
| AlternativeTo, SaaSHub, Toolify, There's An AI For That | Software dir | `/tools` | Free tiers only |
| Pakistani startup directories (StartupPakistan, TechJuice listings) | Regional | `/about` | Editorial submission |
| edu.pk-style education portals with free listing sections | Regional | `/boards` | Vet each: skip if it has a "buy listing" page |

Expected: 8–12 domains. Low authority individually, but they build a clean baseline profile.

## Tier 2 — Board & exam resource pages (highest relevance)

Purpose: topical links from pages that already rank for the queries we want.

Approach: for each target, find the page that lists "useful links / preparation resources"
and pitch one specific, genuinely useful deep link — not the homepage.

- BISE board fan/info sites (result-checking sites, date-sheet sites for Lahore, Karachi,
  Multan, Rawalpindi, Peshawar, Federal) → pitch `/class-9/`, `/class-10/` subject MCQ pages
  as free practice for that board's syllabus.
- MDCAT/ECAT prep blogs and "MDCAT 2026 preparation guide" articles → pitch
  `/exams/mdcat` and `/seo/mdcat-past-papers`.
- FPSC/PPSC/NTS job-portal blogs (jobs sites that also publish "how to prepare" posts) →
  pitch `/mock-tests` and the specific mock test detail page for that recruitment.
- University admission-help sites (NUST NET, PU, COMSATS, IBA) → pitch the matching
  `/seo/*-entry-test` page.
- Scholarship blogs → pitch `/scholarships` (we aggregate, they usually welcome a
  "check current scholarships" link).

Pitch template (short, no flattery, one link, opt-out line):
> Subject: free MCQ practice link for your <topic> page
> Hi — you list preparation resources on <URL>. We run mcqsai.com, a free
> AI-powered MCQ practice site for Pakistani exams. <Deep URL> has <N> free
> practice questions with explanations for exactly this syllabus, no signup needed.
> If it's useful for your readers, feel free to add it. If not, no problem —
> please ignore this email.

Expected: 5–10 domains at a realistic 5–10% reply rate on ~100 pitches.

## Tier 3 — Teacher & student communities (slow, compounding)

Purpose: referral traffic and brand mentions; links are often nofollow but still count as
brand signals for AI/LLM answer engines.

- Reddit: r/pakistan, r/Pakistan_Academia, r/MDCAT, r/CSS_Exam — participate for 3–4 weeks
  before ever linking; answer questions with real substance and link only when the link *is*
  the answer.
- Facebook groups: "MDCAT Preparation 2026", board-specific student groups, "Pakistani
  Teachers Network" — post free resources (topic-wise MCQ sets), not promos.
- WhatsApp/Telegram study channels: offer a free per-subject practice link teachers can
  share; ask for attribution to the topic URL.
- Quora Pakistan (education topics) + LinkedIn posts from a founder account.
- Teacher-facing: offer a free "printable MCQ worksheet" per topic — worksheets are the
  single most link-worthy asset for teacher blogs.

Expected: 5–8 domains + steady referral traffic.

## Tier 4 — Linkable assets to build (before scaling Tier 2/3)

These make outreach convert; without them we're asking for a favour.

1. **Annual exam calendar** — all board date sheets + MDCAT/ECAT/CSS/PPSC dates, one page,
   updated. Naturally cited every year.
2. **Board result checker hub** — we already scrape results; a clean "check your result"
   hub is the highest-link-velocity asset in this niche.
3. **Free downloadable syllabus PDFs per board/class** — currently generated in-app; expose
   a public, indexable version.
4. **Original data study** — e.g. "We analysed 200,000 MCQ attempts: which MDCAT topics
   Pakistani students get wrong most". Journalist/blogger bait; we have the data.
5. **Free embeddable quiz widget** — teachers embed it, each embed carries an attribution
   link.

## Sequencing (90 days)

- Weeks 1–2: Tier 1 submissions (all of them). Set up a tracking sheet: domain, contact,
  date, status, link URL.
- Weeks 3–5: build assets #1 and #2 from Tier 4.
- Weeks 4–10: Tier 2 outreach in batches of 20/week, using the new assets as the pitch.
- Ongoing from week 3: Tier 3 community presence, 30 min/day.
- Week 12: re-pull Semrush backlinks, confirm Authority Score movement, disavow any new
  spam that appears (`docs/disavow.txt`).

## What NOT to do

- No guest-post networks, no "1000 backlinks for $10", no comment-link blasts, no
  site-wide footer link swaps, no directory that asks for payment to be listed.
- No reciprocal-link schemes with other MCQ sites.
- Do not add new spam domains to `docs/disavow.txt` without re-pulling a fresh referring
  domain list first.

## Measurement

Monthly: referring domains (Semrush), Authority Score, GSC "Links" report top linking
sites, referral sessions in GA4, and indexed-page count. Judge tactics by referral traffic
and indexation, not by raw link count.
