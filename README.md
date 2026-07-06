# gitgrade

**Grade your GitHub profile the way a recruiter would — in 5 seconds, no login.**

Paste a username → get a 0–100 score, a letter grade, an 8-dimension breakdown, and a **prioritized list of exactly what to fix**. Runs entirely in your browser against the public GitHub API — no backend, no account, nothing stored.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/LAVYA255/gitgrade)

> This is a **product project**, so the repo doubles as a PM portfolio:
> **[PRD](docs/PRD.md)** · **[Research](docs/RESEARCH.md)** · **[Decisions](docs/DECISIONS.md)** · **[Metrics](docs/METRICS.md)**.

## Why

Your GitHub is your real resume, and a recruiter reads it in ~20 seconds. But the
signals they judge — a profile README, described repos, what's on your front
page, recent activity — are the things developers forget to maintain. gitgrade
gives you that 20-second read back as a score and a fix list. (It was born from
reworking my own profile from 91 messy repos into a curated portfolio; the
checklist became the rubric.)

## How it works

- **Deterministic rubric** — 8 weighted dimensions → 100. No LLM, no key, no
  per-use cost; the formula is open in [`src/grader.ts`](src/grader.ts).
- **Client-side** — fetches your public profile + repos from the GitHub API in
  the browser. Nothing is sent to a server (there isn't one).
- **Specific fixes** — not "improve your profile" but *"42 of your 60 repos have
  no description — add a one-line summary to each."*

### The rubric

| Dimension | Weight | What it rewards |
|---|---:|---|
| Profile README | 20 | A README on your `username/username` repo |
| Bio & identity | 12 | Name, bio, location, a link |
| Front-page repos | 18 | Your most-recent repos have descriptions + topics/demo/stars |
| Repo descriptions | 18 | % of public non-fork repos with a description |
| Social proof | 12 | Stars + followers (log-scaled, capped — it can't sink a good profile) |
| Recent activity | 10 | How recently you pushed |
| Topics / tags | 5 | Repos using topics |
| Focus & curation | 5 | A tight, readable set (clutter is penalized) |

Weights reflect **recruiter impact and what you can actually fix this week** — see [Decisions §5](docs/DECISIONS.md).

## Try it

```bash
npm install
npm run dev                     # the web app
npm run grade -- <username>     # the same engine over the live API, in your terminal
npm test                        # unit tests for the rubric
```

Example (real output):

```
$ npm run grade -- LAVYA255

  Lavya Tanotra  (@LAVYA255)
  ────────────────────────────────────────────
  Score: 76/100   Grade: B
  ████████████ 20/20  Profile README
  ███░░░░░░░░░  3/12  Bio & identity — name, bio, location, and a link all help.
  ...
  [MEDIUM] Complete your profile: add a bio, location, and a link.
```

## Stack

Vite · React 19 · TypeScript · zero runtime deps beyond React. Deploys as a
static site (Vercel/Netlify/GitHub Pages).

MIT © Lavya Tanotra
