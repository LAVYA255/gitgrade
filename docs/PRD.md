# gitgrade — Product Requirements

## Problem

A developer's GitHub profile is their real resume — and most are quietly
underperforming. Recruiters and engineers spend ~20 seconds on a profile, but
the signals they read (a profile README, described repos, pinned flagships,
recent activity) are exactly the things developers forget to maintain. There's
no fast, honest feedback loop: you can't see your profile the way a recruiter
does, so you don't know what's costing you.

I hit this myself while reworking my own GitHub from "91 messy repos" to a
curated portfolio. The checklist I applied was repeatable — so I productized it.

## Target users

1. **Students & new grads** (primary) — applying for internships/first roles, GitHub is their main proof of work, and they're the most likely to have an unpolished profile and to *share* a grading tool.
2. **Job-switching engineers** — want a quick audit before applying.
3. **Anyone curious** — the "score yours" hook drives virality.

## Goals

- Give any developer a **specific, honest, recruiter-lens score** of their public profile in <5 seconds.
- Tell them **exactly what to fix, in priority order** — not vague advice.
- Be **shareable** — a score is a natural social object.

## Non-goals (v1)

- No login / OAuth. No account. No storing anyone's data.
- No "auto-fix" or write access to repos.
- No paid tier. No AI-generated rewrite (deterministic rubric only — see DECISIONS.md).
- Not a vanity-stats dashboard (there are plenty).

## Success metrics

Primary: **profiles graded** and **share rate** (shares ÷ grades). Secondary:
return/second-grade rate (did people fix things and re-check), and sample-click
→ grade conversion. Instrumentation plan in [METRICS.md](./METRICS.md).

## User stories

- *As a student,* I paste my username and immediately see a B− with "add a profile README" as the top fix, so I know the single highest-impact thing to do.
- *As a recruiter-curious dev,* I grade a famous account to sanity-check the tool, then grade my own.
- *As a sharer,* I copy a one-line "I scored 82/100, grade yours →" with a link that grades my profile on open.

## Scope — v1

- Username input → live grade via the public GitHub API (client-side).
- 8-dimension weighted score (profile README, bio/identity, front-page repos, descriptions, social proof, activity, topics, focus) → 0–100 + letter grade.
- Prioritized, **specific** fixes (counts and names, not platitudes).
- Shareable link (`?u=username` auto-grades on open) + copy-to-clipboard.
- Sample profiles to lower the "empty input" barrier.

## Later (post-v1, if metrics justify)

- OG image cards for richer sharing (needs a tiny serverless function).
- Optional AI-written suggestions (bring-your-own-key) on top of the deterministic score.
- Compare two profiles; team/cohort mode for career services.
- "Fix-it" checklists that link straight to the relevant GitHub settings page.

## Definition of done (v1)

Live URL, grades any public user, deterministic scoring documented and tested,
shareable links work, and the repo carries the full PM narrative (this doc +
research + decisions + metrics).
