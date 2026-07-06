/**
 * The grader: a deterministic, weighted rubric over a GitHub profile.
 *
 * Pure by design — it takes already-fetched data and returns a report, so it's
 * unit-testable without the network and identical in the browser and in the
 * `npm run grade` CLI. No LLM, no key, no per-use cost (a deliberate product
 * decision — see docs/DECISIONS.md).
 */

export interface GhUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  followers: number;
  following: number;
  public_repos: number;
  blog: string | null;
  location: string | null;
  company: string | null;
  twitter_username: string | null;
  created_at: string;
}

export interface GhRepo {
  name: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  pushed_at: string;
}

export interface GraderInput {
  user: GhUser;
  repos: GhRepo[];
  /** Whether a profile README (repo named after the user) exists. */
  hasProfileReadme: boolean;
  /** Injected for testability/determinism. */
  now?: number;
}

export interface DimensionScore {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface Fix {
  priority: "high" | "medium" | "low";
  text: string;
}

export interface Report {
  username: string;
  name: string;
  avatar: string;
  score: number; // 0..100
  grade: string; // A+ .. F
  dimensions: DimensionScore[];
  fixes: Fix[];
  summary: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const daysBetween = (fromISO: string, now: number) =>
  Math.floor((now - new Date(fromISO).getTime()) / 86_400_000);

function letterGrade(score: number): string {
  if (score >= 93) return "A+";
  if (score >= 88) return "A";
  if (score >= 83) return "A-";
  if (score >= 78) return "B+";
  if (score >= 72) return "B";
  if (score >= 66) return "B-";
  if (score >= 60) return "C+";
  if (score >= 52) return "C";
  if (score >= 42) return "D";
  return "F";
}

export function grade(input: GraderInput): Report {
  const { user, repos, hasProfileReadme } = input;
  const now = input.now ?? Date.now();

  const kept = repos.filter((r) => !r.private && !r.fork && !r.archived);
  const described = kept.filter((r) => (r.description ?? "").trim().length > 0);
  const describedFrac = kept.length ? described.length / kept.length : 0;
  const withTopics = kept.filter((r) => (r.topics?.length ?? 0) > 0);
  const topicsFrac = kept.length ? withTopics.length / kept.length : 0;
  const totalStars = kept.reduce((s, r) => s + r.stargazers_count, 0);

  // The repos a visitor sees first (proxy for "pins").
  const top = [...kept].sort((a, b) => b.pushed_at.localeCompare(a.pushed_at)).slice(0, 6);
  const topQualityFrac = top.length
    ? top.filter(
        (r) =>
          (r.description ?? "").trim().length > 0 &&
          (!!r.homepage || (r.topics?.length ?? 0) > 0 || r.stargazers_count > 0),
      ).length / top.length
    : 0;

  const lastPushDays = kept.length
    ? Math.min(...kept.map((r) => daysBetween(r.pushed_at, now)))
    : Infinity;

  const dims: DimensionScore[] = [];

  // 1) Profile README — 20
  dims.push({
    key: "profile_readme",
    label: "Profile README",
    max: 20,
    score: hasProfileReadme ? 20 : 0,
    detail: hasProfileReadme
      ? "Present — the first thing visitors see."
      : "Missing — no README on your profile.",
  });

  // 2) Identity & bio — 12
  let idScore = 0;
  if ((user.name ?? "").trim()) idScore += 3;
  if ((user.bio ?? "").trim()) idScore += 4;
  if ((user.location ?? "").trim() || (user.company ?? "").trim()) idScore += 2;
  if ((user.blog ?? "").trim() || (user.twitter_username ?? "").trim()) idScore += 3;
  dims.push({
    key: "identity",
    label: "Bio & identity",
    max: 12,
    score: idScore,
    detail: `${idScore}/12 — name, bio, location, and a link all help.`,
  });

  // 3) Front-page repo quality — 18
  dims.push({
    key: "top_repos",
    label: "Front-page repos",
    max: 18,
    score: Math.round(topQualityFrac * 18),
    detail: `${Math.round(topQualityFrac * 100)}% of your most-recent repos have a description + topics/demo/stars.`,
  });

  // 4) Repo hygiene (descriptions) — 18
  dims.push({
    key: "descriptions",
    label: "Repo descriptions",
    max: 18,
    score: Math.round(describedFrac * 18),
    detail: `${described.length}/${kept.length} public repos have a description.`,
  });

  // 5) Signal (stars + followers) — 12
  const starPts = clamp(Math.round(2 * Math.log10(totalStars + 1)), 0, 6);
  const followerPts = clamp(Math.round(2 * Math.log10(user.followers + 1)), 0, 6);
  dims.push({
    key: "signal",
    label: "Social proof",
    max: 12,
    score: starPts + followerPts,
    detail: `${totalStars} stars · ${user.followers} followers.`,
  });

  // 6) Activity (recency) — 10
  let activity = 0;
  if (lastPushDays <= 30) activity = 10;
  else if (lastPushDays <= 90) activity = 7;
  else if (lastPushDays <= 180) activity = 4;
  else if (lastPushDays <= 365) activity = 2;
  dims.push({
    key: "activity",
    label: "Recent activity",
    max: 10,
    score: activity,
    detail: Number.isFinite(lastPushDays)
      ? `Last push ${lastPushDays} day(s) ago.`
      : "No public repo activity found.",
  });

  // 7) Topics — 5
  dims.push({
    key: "topics",
    label: "Topics / tags",
    max: 5,
    score: Math.round(topicsFrac * 5),
    detail: `${withTopics.length}/${kept.length} repos use topics.`,
  });

  // 8) Focus (clutter penalty) — 5
  const cluttered = kept.length > 25 && describedFrac < 0.5;
  dims.push({
    key: "focus",
    label: "Focus & curation",
    max: 5,
    score: cluttered ? 1 : kept.length === 0 ? 2 : 5,
    detail: cluttered
      ? `${kept.length} public repos, many undescribed — your best work is buried.`
      : "A curated, readable set of repos.",
  });

  const score = clamp(
    Math.round(dims.reduce((s, d) => s + d.score, 0)),
    0,
    100,
  );

  // ---- Fixes (specific + prioritized) ----
  const fixes: Fix[] = [];
  if (!hasProfileReadme) {
    fixes.push({
      priority: "high",
      text: `Add a profile README: create a public repo named "${user.login}" with a README.md. It's the first thing visitors and recruiters see.`,
    });
  }
  const undescribed = kept.length - described.length;
  if (describedFrac < 0.8 && undescribed > 0) {
    fixes.push({
      priority: undescribed > 10 ? "high" : "medium",
      text: `${undescribed} of your ${kept.length} public repos have no description — add a one-line summary to each so they don't read as abandoned.`,
    });
  }
  if (topQualityFrac < 0.8 && top.length > 0) {
    fixes.push({
      priority: "high",
      text: "Polish the repos a recruiter sees first: pin your 6 strongest and give each a description, topics, and a demo link where possible.",
    });
  }
  if (idScore < 9) {
    fixes.push({
      priority: "medium",
      text: "Complete your profile: add a name, a one-line bio, your location, and a link (portfolio/LinkedIn).",
    });
  }
  if (cluttered) {
    fixes.push({
      priority: "medium",
      text: `You have ${kept.length} public repos — archive old experiments so your flagship work stands out.`,
    });
  }
  if (topicsFrac < 0.4) {
    fixes.push({
      priority: "low",
      text: "Add topics/tags to your repos — they aid discovery and make a project look maintained.",
    });
  }
  if (activity <= 4) {
    fixes.push({
      priority: "low",
      text: "Ship something small and public this week — recent activity signals momentum.",
    });
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  fixes.sort((a, b) => order[a.priority] - order[b.priority]);

  const g = letterGrade(score);
  const top1 = fixes[0]?.text;
  const summary =
    score >= 85
      ? "Strong, recruiter-ready profile. A few small touches keep it there."
      : score >= 70
        ? `Solid foundation. Your biggest win: ${top1 ?? "keep polishing descriptions and pins."}`
        : score >= 50
          ? `Real potential that's underselling itself. Start here: ${top1 ?? "add a profile README and descriptions."}`
          : `Lots of quick wins available. Start here: ${top1 ?? "add a profile README."}`;

  return {
    username: user.login,
    name: user.name ?? user.login,
    avatar: user.avatar_url,
    score,
    grade: g,
    dimensions: dims,
    fixes,
    summary,
  };
}
