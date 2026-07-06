# Decision Log

Each entry: the decision, the alternative, and why. These are the tradeoffs that
shaped v1.

### 1. Fully client-side, no backend
**Chose:** grade in the browser against the public GitHub API (CORS-enabled).
**Over:** a Node/serverless backend.
**Why:** zero servers means zero marginal cost and zero ops — so the "grade
yours" growth loop has no cost ceiling and can't fall over under a traffic
spike. It also means we store nothing about anyone (privacy by construction).
**Cost:** bound by GitHub's unauthenticated rate limit (60 req/hr/IP ≈ ~20
grades). Mitigated by an optional user-supplied token and clear messaging. If
usage outgrows it, a thin caching proxy is the first addition.

### 2. Deterministic rubric, not an LLM
**Chose:** a transparent, weighted rubric (8 dimensions → 100).
**Over:** asking an LLM to "rate this profile."
**Why:** (a) **cost** — an LLM call per grade would reintroduce a per-use cost
and a key to protect, killing decision #1; (b) **trust** — a score you can read
the formula for is more credible and reproducible than a vibe from a model; (c)
**speed** — instant vs a multi-second call. The rubric is open in `src/grader.ts`.
**Cost:** less nuance than an LLM on edge cases. Acceptable — the fixes are the
value, and they're concrete. LLM suggestions are a future *opt-in* layer, not the core.

### 3. No login / OAuth
**Chose:** username-only, public data.
**Over:** GitHub OAuth (which would unlock pinned repos, private counts, contribution graph).
**Why:** login is the biggest drop-off point and the biggest trust ask. The 20-
second recruiter read is *public* anyway, so grading public data matches the job.
**Cost:** can't read pins via REST without auth → approximated with a
"front-page repos" dimension (the 6 most-recently-pushed non-fork repos). Called
out honestly in the UI copy.

### 4. Cut OG-image share cards from v1
**Chose:** copy-to-clipboard text + a `?u=` link that auto-grades on open.
**Over:** generated OG images per profile (richer social unfurls).
**Why:** OG images need a serverless renderer — that breaks the "no backend"
decision for a v1 nice-to-have. The `?u=` link already delivers the core loop
(open → see your grade). OG cards are the first thing to add if share rate is
strong.

### 5. Weights reflect recruiter impact, not what's easy to measure
**Chose:** Profile README (20) and front-page/descriptions (18+18) dominate;
stars/followers capped at 12 and log-scaled.
**Over:** rewarding raw stars/followers heavily.
**Why:** stars/followers are largely *not in the user's short-term control* and
would make the score feel unfair and unactionable. The rubric weights things a
user can fix this week. Social proof still counts, but can't sink a good profile.

### 6. Forks, archived, and private repos excluded from hygiene
**Chose:** grade only public, non-fork, non-archived repos for descriptions/topics.
**Why:** you shouldn't be penalized for an un-described fork or for archiving old
work — archiving is *good* curation. This makes the score reward the behavior we
actually want.
