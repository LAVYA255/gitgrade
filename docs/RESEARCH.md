# Competitive & User Research

## The landscape

Tools around GitHub profiles cluster into three buckets. None of them do the
one thing gitgrade does — grade your profile the way a recruiter would and tell
you what to fix.

| Product | What it does | Gap it leaves |
|---|---|---|
| **github-readme-stats** (anuraghazra) | Embeds stat cards (stars, commits, top langs) in your README | Shows numbers, makes no *judgment*. Low counts look bad; it never says "here's what to fix." |
| **readme.so / profile README generators** | Drag-and-drop to *author* a profile README | Helps you make one; doesn't tell you whether your overall profile is working. |
| **GitHub Achievements / Profile** | GitHub's own badges + pinned repos | No external, honest score; no prioritized guidance. |
| **GitRoll / code-grading tools** | Score your *code* / skills from repo contents | Deep code analysis, slow, often needs auth. Different job — gitgrade grades the *profile presentation*, the 20-second recruiter read. |
| **Resume/portfolio review services** | Human review, paid, slow | Not instant, not free, not shareable. |

## The wedge

Everyone helps you *build* profile assets or *measure* raw stats. Nobody gives
the **recruiter-lens verdict + a prioritized fix list**, instantly and for free.
That verdict is also the shareable object ("I got a B, grade yours") the other
tools lack — stat cards and README generators aren't fun to share.

## Insight from doing it manually

Reworking a real profile (mine) surfaced which signals actually move the needle,
and in what order:

1. **Profile README** — biggest single lever; its absence is the most common miss.
2. **Descriptions on repos** — an undescribed repo reads as abandoned; this is the most *common, highest-count* fixable gap.
3. **What's on the front page** — the first ~6 repos a visitor sees carry disproportionate weight (hence a dedicated dimension, since REST can't read pins).
4. **Identity basics** (bio/location/link) — trivially fixable, often empty. (My own profile scored 3/12 here even after a full rework — evidence the gap is easy to miss.)

These became the weights in the rubric ([../src/grader.ts](../src/grader.ts)).

## Positioning

> The 20-second recruiter read of your GitHub — scored, with a fix list. Free, no login.

## Distribution hypothesis

The audience most likely to (a) need this and (b) share it is students/new-grads
in job season. Channels: campus/college dev groups, r/cscareerquestions-style
communities, and dev social (the "grade yours" link is the growth loop). Cost to
serve is ~zero (client-side), so virality has no marginal-cost ceiling.
