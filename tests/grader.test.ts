import { describe, it, expect } from "vitest";
import { grade, type GhRepo, type GhUser, type GraderInput } from "../src/grader.js";

const NOW = Date.parse("2026-07-06T00:00:00Z");

function repo(over: Partial<GhRepo> = {}): GhRepo {
  return {
    name: "r",
    description: "does a thing",
    fork: false,
    archived: false,
    private: false,
    stargazers_count: 0,
    forks_count: 0,
    language: "TypeScript",
    topics: ["typescript"],
    homepage: null,
    pushed_at: "2026-07-01T00:00:00Z",
    ...over,
  };
}

function user(over: Partial<GhUser> = {}): GhUser {
  return {
    login: "dev",
    name: "Dev Eloper",
    bio: "I build things",
    avatar_url: "https://x/y.png",
    followers: 10,
    following: 5,
    public_repos: 6,
    blog: "https://dev.example",
    location: "Bengaluru",
    company: null,
    twitter_username: null,
    created_at: "2022-01-01T00:00:00Z",
    ...over,
  };
}

describe("grade", () => {
  it("rewards a polished profile with a high grade", () => {
    const input: GraderInput = {
      user: user({ followers: 200 }),
      repos: Array.from({ length: 6 }, (_, i) =>
        repo({ name: `r${i}`, stargazers_count: 20, homepage: "https://x" }),
      ),
      hasProfileReadme: true,
      now: NOW,
    };
    const r = grade(input);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(["A+", "A", "A-"]).toContain(r.grade);
    expect(r.dimensions.reduce((s, d) => s + d.max, 0)).toBe(100);
  });

  it("penalizes a cluttered, undescribed, README-less profile and gives targeted fixes", () => {
    const input: GraderInput = {
      user: user({ name: null, bio: null, blog: null, location: null, followers: 0, public_repos: 40 }),
      repos: Array.from({ length: 40 }, (_, i) =>
        repo({ name: `r${i}`, description: null, topics: [], stargazers_count: 0, pushed_at: "2024-01-01T00:00:00Z" }),
      ),
      hasProfileReadme: false,
      now: NOW,
    };
    const r = grade(input);
    expect(r.score).toBeLessThan(45);
    expect(r.grade === "D" || r.grade === "F").toBe(true);
    // The top fix should be the profile README.
    expect(r.fixes[0]?.text).toMatch(/profile README/i);
    // A specific, counted description fix should be present.
    expect(r.fixes.some((f) => /40 of your 40 public repos have no description/.test(f.text))).toBe(true);
    // Clutter and activity fixes too.
    expect(r.fixes.some((f) => /archive old experiments/.test(f.text))).toBe(true);
  });

  it("ignores forks, archived, and private repos in hygiene", () => {
    const input: GraderInput = {
      user: user(),
      repos: [
        repo({ name: "keep", description: "real" }),
        repo({ name: "fork", fork: true, description: null }),
        repo({ name: "arch", archived: true, description: null }),
        repo({ name: "priv", private: true, description: null }),
      ],
      hasProfileReadme: true,
      now: NOW,
    };
    const r = grade(input);
    const desc = r.dimensions.find((d) => d.key === "descriptions")!;
    // Only "keep" counts, and it's described → full marks.
    expect(desc.score).toBe(desc.max);
    expect(desc.detail).toContain("1/1");
  });
});
