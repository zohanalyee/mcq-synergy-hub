# Report — Speed test + auto-fill topic breakdown (13 Sep 2026)

## Part 1 — Homepage speed test: could not be run from here

The Google PageSpeed service refused both mobile and desktop runs with a
daily-quota error (HTTP 429) for the shared address this environment uses. No
numbers were produced, so nothing about TBT or unused JavaScript can be
confirmed yet from this side.

Two ways forward — your pick:

1. You run PageSpeed Insights in your browser on https://mcqsai.com/ (mobile +
   desktop) and paste the scores; I compare them to the last run.
2. I run a local lab measurement inside the build environment instead. It gives
   comparable TBT / unused-JavaScript figures but is not the same machine or
   network as Google's, so absolute scores will differ from PageSpeed.

## Part 2 — Yesterday's generation (12 Sep), topic by topic

Totals: 496 questions created — 366 published, 124 held as duplicates, 6 waiting.
51 topics received questions.

Grouped by priority scope (published count in brackets):

| Scope | Topics | Added | Published |
| --- | --- | --- | --- |
| MDCAT scope (biology / physics / chemistry / Class 11-12) | 31 | 325 | 240 |
| Everything else (GK, English, Social Sciences, Computer, Maths) | 20 | 171 | 126 |

Of these, only 1 topic was a genuine near-miss (had 1-4 published questions
before) and 10 topics already had 5+; the remaining 40 started from an empty
bank for that exact subject+topic label. So yesterday's run was mostly
empty-bank filling, not the 58-topic near-miss sprint.

Full list — `subject :: topic :: added/published :: published before`:

```text
Physics :: Magnetism :: 21/18 :: 0
Physics :: Electricity :: 20/17 :: 0
Physics :: Thermodynamics :: 19/11 :: 26
Science & Mathematics :: Mathematics :: 16/9 :: 0
Physics :: Mechanics :: 15/10 :: 27
Chemistry :: Organic Chemistry :: 13/10 :: 39
Class 12 :: Urdu :: 10/10 :: 0
General Knowledge :: Sindh Studies :: 10/10 :: 0
Chemistry :: Inorganic Chemistry :: 10/6 :: 8
Class 10 :: Biology :: 10/8 :: 0
Physics Class 9 :: Transfer of Heat :: 10/9 :: 0
Physics Class 9 :: Work & Energy :: 10/7 :: 0
Chemistry Class 9 :: Electrochemistry :: 10/10 :: 0
Science & Mathematics :: Computer Science :: 10/4 :: 0
Class 12 :: Physics :: 10/3 :: 0
Class 12 :: English :: 10/3 :: 0
Physics Class 9 :: Dynamics :: 10/8 :: 0
Class 11 :: Economics :: 10/10 :: 0
Social Sciences :: Political Science :: 10/10 :: 0
Class 9 :: Physics :: 10/7 :: 0
Chemistry Class 9 :: Structure of Atoms :: 10/4 :: 0
Class 9 :: Urdu :: 10/10 :: 0
Chemistry Class 9 :: Physical States of Matter :: 10/6 :: 0
General Knowledge :: Pakistan Affairs :: 10/2 :: 0
General Knowledge :: Current Affairs :: 10/5 :: 13
Science Subjects :: Computer Science :: 10/3 :: 0
Social Sciences :: Sociology :: 10/10 :: 0
Chemistry :: Industrial :: 10/10 :: 0
Chemistry Class 9 :: Periodic Table :: 10/10 :: 0
Science & Mathematics :: Statistics :: 10/7 :: 0
English & Aptitude :: Grammar :: 9/8 :: 0
Science Subjects :: Statistics :: 9/8 :: 0
Biology Class 9 :: Transport :: 9/4 :: 0
Science Subjects :: Biology :: 9/5 :: 0
Class 11 :: Biology :: 9/1 :: 0
Class 12 :: Mathematics :: 9/8 :: 0
Biology Class 9 :: Biodiversity :: 9/8 :: 0
Mathematics :: Calculus :: 9/8 :: 0
English & Aptitude :: Vocabulary :: 8/7 :: 0
English & Aptitude :: Comprehension :: 8/8 :: 0
English :: Antonyms :: 8/8 :: 20
General Knowledge :: Islamic Studies :: 8/6 :: 11
Physics Class 9 :: Physical Quantities :: 8/7 :: 0
Biology Class 9 :: Bioenergetics :: 7/6 :: 0
English :: Vocabulary :: 7/6 :: 15
Physics :: Waves :: 6/6 :: 26
General Knowledge :: World GK :: 6/4 :: 19
Chemistry :: Physical :: 6/5 :: 0
Science & Mathematics :: Physics :: 5/3 :: 4
Non-Verbal Intelligence :: Non-Verbal Intelligence :: 3/3 :: 0
```

## Today so far (13 Sep, up to 05:00 UTC)

244 created — 169 published, 71 held as duplicates, 4 waiting, across 26 topics.
Heavily science/class-level: Biology Class 9 (Solving a Biological Problem, Cell
Cycle, Nutrition, Cells), Class 9-12 Biology/Physics/Chemistry, Chemistry Class 9,
Physics (Modern, Optics, Nuclear), plus Urdu / English / Pakistan Studies at
class level.

Duplicate-hold rate: 25% yesterday, 29% today — far better than the ~93% discard
level seen before the deficit-first fix.
