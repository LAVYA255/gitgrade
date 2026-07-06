import type { GhRepo, GhUser, GraderInput } from "./grader.js";

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly kind: "not_found" | "rate_limited" | "network" | "unknown",
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

const API = "https://api.github.com";

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch(path: string, token?: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, { headers: headers(token) });
  } catch {
    throw new GitHubError("Network error reaching GitHub.", "network");
  }
  if (res.status === 404) throw new GitHubError("That GitHub user doesn't exist.", "not_found");
  if (
    res.status === 403 &&
    res.headers.get("x-ratelimit-remaining") === "0"
  ) {
    throw new GitHubError(
      "GitHub API rate limit hit. Add a personal access token, or try again later.",
      "rate_limited",
    );
  }
  return res;
}

/** Fetch everything the grader needs for a username. */
export async function fetchProfile(username: string, token?: string): Promise<GraderInput> {
  const clean = username.trim().replace(/^@/, "");
  if (!clean) throw new GitHubError("Enter a GitHub username.", "unknown");

  const userRes = await ghFetch(`/users/${encodeURIComponent(clean)}`, token);
  if (!userRes.ok) throw new GitHubError(`GitHub returned ${userRes.status}.`, "unknown");
  const user = (await userRes.json()) as GhUser;

  // Repos — paginate up to 3 pages (300 repos) sorted by most recent push.
  const repos: GhRepo[] = [];
  for (let page = 1; page <= 3; page++) {
    const res = await ghFetch(
      `/users/${encodeURIComponent(clean)}/repos?per_page=100&page=${page}&sort=pushed`,
      token,
    );
    if (!res.ok) break;
    const batch = (await res.json()) as GhRepo[];
    repos.push(...batch);
    if (batch.length < 100) break;
  }

  // Profile README: a repo named exactly after the user with a README.
  let hasProfileReadme = false;
  try {
    const rmRes = await ghFetch(`/repos/${clean}/${clean}/readme`, token);
    hasProfileReadme = rmRes.ok;
  } catch (e) {
    if (e instanceof GitHubError && e.kind === "rate_limited") throw e;
    hasProfileReadme = false; // 404 → no profile README
  }

  return { user, repos, hasProfileReadme };
}
