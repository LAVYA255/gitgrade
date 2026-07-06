# Metrics

## What we measure and why

The product has one job (grade → fix → share), so the funnel is short and the
metrics map directly to it.

| Metric | Definition | Why it matters |
|---|---|---|
| **Grades** | # of successful gradings | Top-line usage / reach |
| **Share rate** | shares ÷ grades | Is the score a good social object? Drives the growth loop |
| **Re-grade rate** | users who grade the *same* username again ≥1 day later | Proxy for "did the fixes help / did they act on it" |
| **Sample→grade** | sample-click sessions that then grade a real username | Does the demo convert the curious into users |
| **Error rate** | grades failing (404 / rate-limit / network) ÷ attempts | Health; rate-limit share tells us if a proxy is needed |
| **Score distribution** | histogram of scores | Sanity-check the rubric isn't skewed; find where users cluster |

## How it's instrumented

Privacy-first, cookieless analytics (e.g. **Plausible** or **PostHog EU**, both
support custom events without PII). No profile data is stored — we log **events**,
not who was graded. Planned custom events:

- `grade_submitted` `{ source: "input" | "sample" | "shared_link" }`
- `grade_succeeded` `{ score_bucket: "0-49" | "50-69" | "70-84" | "85-100" }`
- `grade_failed` `{ kind: "not_found" | "rate_limited" | "network" }`
- `share_clicked`
- `view_profile_clicked`
- `grade_another_clicked`

`score_bucket` (not the raw score) and no username keep it non-identifying.

> **Wiring:** add the analytics snippet in `index.html` and fire events from the
> handlers in `App.tsx` (`run`, `share`). Left out of the committed code so the
> repo has no tracker by default — it's a one-line add at deploy time.

## Targets (first 30 days after launch)

These are hypotheses to test, not promises:

- **≥ 500 grades** from an initial share to student/dev communities.
- **Share rate ≥ 15%** — the bar for "this is worth sharing."
- **Error (rate-limit) share < 5%** — above that, ship the caching proxy.
- **Sample→grade ≥ 40%** — the demo should convert the curious.

## Results (post-launch — TBD)

Filled in once live. Honest placeholder so the number isn't faked.

| Window | Grades | Share rate | Re-grade | Rate-limit errors | Notes |
|---|---|---|---|---|---|
| Launch week | — | — | — | — | — |
| Week 4 | — | — | — | — | — |

**What I'd do with the data:** if share rate clears the bar, build OG cards
(DECISIONS §4) to compound it. If rate-limit errors spike, add the proxy. If
scores cluster low on one dimension across users, that's a content opportunity
(a short "how to fix your profile README" guide as an SEO/GEO on-ramp).
