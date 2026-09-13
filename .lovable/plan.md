# Mobile speed regression — audit findings (no changes made)

## Short answer

The mobile numbers you saw cannot be treated as a real regression yet. The three
shifts you reported (FCP +0.4s, LCP +0.3s, score 56→47) are inside the range that
a single throttled mobile run varies by, and my own repeat measurements today
show swings of that size and larger on the same unchanged build.

Nothing in the prefetch fix is mobile-specific: the delay logic runs identically
on both form factors, and it only skips prefetch entirely for data-saver / 2G
connections — a saving, never a cost. So there is no mechanism by which desktop
gains and mobile loses from that change.

## What I measured today

Three back-to-back mobile lab runs of the live site from this environment:

| Run | Score | FCP | LCP | TBT | CLS |
|-----|-------|-----|-----|-----|-----|
| 1 | 75 | 0.9 s | 3.0 s | 850 ms | 0.003 |
| 2 | 73 | 1.0 s | 3.1 s | 960 ms | 0.003 |
| 3 | 78 | 0.9 s | 1.7 s | 940 ms | 0.003 |

LCP moved 1.7s → 3.1s (a 1.4s spread) across identical runs of identical code.
That alone is ~5x the 0.3s "regression" you're asking about. Score moved 5
points run to run. Conclusion: a single run's mobile delta of this size carries
no signal.

Two caveats that matter for how much weight to give these numbers:

1. These runs came from a data-centre IP, so Cloudflare served a bot challenge
   before the app. Almost all the measured script time (~1.2s) and every long
   task belongs to that challenge page, not to our code. So the table is useful
   for **variance**, not for absolute app performance.
2. Google's own PageSpeed service refused every request today with a
   daily-quota error, so I could not reproduce the exact PSI mobile conditions.

CLS was stable at 0.003 in all three runs — the earlier layout-shift work is
holding.

## Why desktop improved and mobile looks flat

- Desktop Lighthouse runs unthrottled, so the prefetch work the fix removed was
  a large share of a small total (TBT 670ms → 70ms). Removing it is unmissable.
- Mobile is CPU-throttled 4x and network-throttled, so total main-thread time is
  several seconds. The same removed work is a small share of a big total, and it
  gets buried under the throttled cost of everything else. Mobile also weights
  LCP + FCP + CLS at 60% of the score, and the prefetch fix by design does not
  touch LCP or FCP — it targets post-paint blocking time.
- So "desktop big win, mobile roughly unchanged" is the expected shape of this
  fix, not a contradiction. Mobile's remaining problem is first paint under
  throttling, which is a separate piece of work.

## What would settle it

Since I cannot use Google's service today, one of these:

1. **You run PSI mobile 3 times** on mcqsai.com in your browser and paste the
   three sets of numbers. Three runs is the minimum to separate signal from
   noise. If mobile TBT is also up (not just FCP/LCP), that is worth a real
   investigation; if only FCP/LCP wobble, it is noise.
2. **I take a local production measurement** — build the app here and run mobile
   Lighthouse 3x against it. This avoids both the Cloudflare challenge and the
   PSI quota, and isolates our code from ad/analytics noise. Requires a build,
   which I have not run in audit mode.

## If mobile first paint is the real target

Separate from this run-to-run question, mobile FCP/LCP in the 4–7s band on PSI
is dominated by: render-blocking font CSS from a third-party origin, the
JS-dependent first paint of the app shell, and throttled execution of the
provider stack before any content exists. Addressing that means work on the
critical path itself, not on prefetch. Worth its own phase once we have three
consistent mobile runs to measure against.

No code, config, or infrastructure was changed in this audit.
