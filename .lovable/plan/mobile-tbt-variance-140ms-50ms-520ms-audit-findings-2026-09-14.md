# Mobile TBT variance (140ms / 50ms / 520ms) — audit findings

Your three runs settle the earlier question: FCP ~4.1s and LCP ~6.0s are stable,
so the 5.1s/7.8s reading was an outlier, not a regression. What is left is TBT
swinging 10x between runs. Everything below is read from the code as it is live
today; I could not add fresh PageSpeed runs because Google's speed service is
still refusing requests from here with a daily-quota error.

## 1. Third-party scripts — yes, this is the main suspect

Two third-party scripts land in a timing window that sometimes falls inside the
measured trace and sometimes just outside it:

- **AdSense** is injected 1.5 seconds after the page's load event (`index.html`),
and also immediately on the first scroll/tap/keypress. On a throttled mobile
run, "1.5s after load" sits almost exactly on the edge of where the trace
stops. When the script lands inside the window, its download plus execution is
counted; when the trace closes first, it costs nothing. That single on/off
difference is easily worth several hundred milliseconds of blocking time —
which matches your 50ms vs 520ms spread.
- **Analytics** loads at the bottom of the page on every run, so it contributes a
baseline, not the swing.

A second, smaller source of run-to-run difference: on the home page itself no ad
unit is placed, so nothing fills — but the ad library still loads and
initialises, and how much work it does before the trace ends is not
deterministic between runs.

## 2. Our own prefetch delay — not firing in the window in normal runs

The route prefetch waits for the load event and then for the first real user
signal, with a 6-second fallback timer. A speed test never taps or scrolls, and
the trace almost always closes before load + 6 seconds, so the prefetch is
normally excluded. It is only borderline in a fast run where load happens very
early; the ad timer at 1.5s is far more likely to be the swing than the
prefetch at 6s. So: not the primary cause, but not provably zero either — it is
the second thing to confirm.

## 3. A continuously running timer we should look at

Independently of the third parties, the analytics engagement tracker runs a
frame-by-frame loop for the first 60 seconds of every visit (to record 10s / 30s
/ 60s engagement). Each tick is tiny, but it runs on every single frame for the
whole trace, on throttled mobile, and it makes the main thread more likely to tip
individual tasks over the 50ms "long task" line. This is a plausible amplifier
for why the same page sometimes registers long tasks and sometimes doesn't. It
can be rewritten to three plain timers with identical analytics output.

## What I could not verify from here

- Which exact scripts owned the long tasks in your 520ms run. Lighthouse only
reports that per run, and the PSI service is quota-blocked for me today. Local
runs against the live domain are useless for this because our data-centre IP
gets served a Cloudflare bot challenge, whose own script then dominates the
entire measurement (I confirmed this: ~1.2s of script time and every long task
belonged to the challenge page, not to our app).

## How to confirm the cause (no code changes)

Either of these gives a definitive answer:

1. **You capture it**: run PSI mobile until you get another high-TBT run, then
  open the report's own long-tasks / third-party sections and paste them — the
   script names there decide it outright.
2. **I measure locally against a production build** — this avoids both the
  Cloudflare challenge and the PSI quota, and lets me run the page with the ad
   and analytics tags blocked vs allowed, five runs each. That comparison isolates
   the third-party contribution precisely. It needs a build, which I have not run
   in audit mode.

## Candidate fixes, for a later phase

Listed for completeness — nothing applied:

- Move the ad library from a fixed 1.5s timer to a first-interaction-only or
clearly-later trigger, so it never straddles the measurement boundary and real
users on the home page (where no ad is placed) don't pay for it at all.
- Replace the per-frame engagement loop with three timers, output unchanged.
- Optionally have the prefetch wait on interaction only, dropping the 6s
fallback.

Expected effect: a stable low TBT run to run, rather than a lucky-run score
between 51 and 66. No code, config, or infrastructure was changed in this audit.

&nbsp;

# Mobile TBT variance (140ms / 50ms / 520ms) — audit findings

Your three runs settle the earlier question: FCP ~4.1s and LCP ~6.0s are stable,

so the 5.1s/7.8s reading was an outlier, not a regression. What is left is TBT

swinging 10x between runs. Everything below is read from the code as it is live

today; I could not add fresh PageSpeed runs because Google's speed service is

still refusing requests from here with a daily-quota error.

## 1. Third-party scripts — yes, this is the main suspect

Two third-party scripts land in a timing window that sometimes falls inside the

measured trace and sometimes just outside it:

- **AdSense** is injected 1.5 seconds after the page's load event `index.html`),

  and also immediately on the first scroll/tap/keypress. On a throttled mobile

  run, "1.5s after load" sits almost exactly on the edge of where the trace

  stops. When the script lands inside the window, its download plus execution is

  counted; when the trace closes first, it costs nothing. That single on/off

  difference is easily worth several hundred milliseconds of blocking time —

  which matches your 50ms vs 520ms spread.

- **Analytics** loads at the bottom of the page on every run, so it contributes a

  baseline, not the swing.

A second, smaller source of run-to-run difference: on the home page itself no ad

unit is placed, so nothing fills — but the ad library still loads and

initialises, and how much work it does before the trace ends is not

deterministic between runs.

## 2. Our own prefetch delay — not firing in the window in normal runs

The route prefetch waits for the load event and then for the first real user

signal, with a 6-second fallback timer. A speed test never taps or scrolls, and

the trace almost always closes before load + 6 seconds, so the prefetch is

normally excluded. It is only borderline in a fast run where load happens very

early; the ad timer at 1.5s is far more likely to be the swing than the

prefetch at 6s. So: not the primary cause, but not provably zero either — it is

the second thing to confirm.

## 3. A continuously running timer we should look at

Independently of the third parties, the analytics engagement tracker runs a

frame-by-frame loop for the first 60 seconds of every visit (to record 10s / 30s

/ 60s engagement). Each tick is tiny, but it runs on every single frame for the

whole trace, on throttled mobile, and it makes the main thread more likely to tip

individual tasks over the 50ms "long task" line. This is a plausible amplifier

for why the same page sometimes registers long tasks and sometimes doesn't. It

can be rewritten to three plain timers with identical analytics output.

## What I could not verify from here

- Which exact scripts owned the long tasks in your 520ms run. Lighthouse only

  reports that per run, and the PSI service is quota-blocked for me today. Local

  runs against the live domain are useless for this because our data-centre IP

  gets served a Cloudflare bot challenge, whose own script then dominates the

  entire measurement (I confirmed this: ~1.2s of script time and every long task

  belonged to the challenge page, not to our app).

## How to confirm the cause (no code changes)

Either of these gives a definitive answer:

1. **You capture it**: run PSI mobile until you get another high-TBT run, then

   open the report's own long-tasks / third-party sections and paste them — the

   script names there decide it outright.

2. **I measure locally against a production build** — this avoids both the

   Cloudflare challenge and the PSI quota, and lets me run the page with the ad

   and analytics tags blocked vs allowed, five runs each. That comparison isolates

   the third-party contribution precisely. It needs a build, which I have not run

   in audit mode.

## Candidate fixes, for a later phase

Listed for completeness — nothing applied:

- Move the ad library from a fixed 1.5s timer to a first-interaction-only or

  clearly-later trigger, so it never straddles the measurement boundary and real

  users on the home page (where no ad is placed) don't pay for it at all.

- Replace the per-frame engagement loop with three timers, output unchanged.

- Optionally have the prefetch wait on interaction only, dropping the 6s

  fallback.

Expected effect: a stable low TBT run to run, rather than a lucky-run score

between 51 and 66. No code, config, or infrastructure was changed in this audit.

&nbsp;