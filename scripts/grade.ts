/**
 * CLI grader — the same engine the web app uses, over the live GitHub API.
 * Used to verify the pipeline end-to-end.
 *
 * Run: `npm run grade -- <username>`  (optional: GITHUB_TOKEN env for higher limits)
 */
import { fetchProfile, GitHubError } from "../src/github.js";
import { grade } from "../src/grader.js";

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Usage: npm run grade -- <github-username>");
    process.exit(1);
  }

  try {
    const input = await fetchProfile(username, process.env.GITHUB_TOKEN);
    const r = grade(input);

    console.log(`\n  ${r.name}  (@${r.username})`);
    console.log(`  ${"─".repeat(44)}`);
    console.log(`  Score: ${r.score}/100   Grade: ${r.grade}`);
    console.log(`  ${r.summary}\n`);
    console.log("  Breakdown:");
    for (const d of r.dimensions) {
      const bar = "█".repeat(Math.round((d.score / d.max) * 12)).padEnd(12, "░");
      console.log(`    ${bar} ${String(d.score).padStart(2)}/${d.max}  ${d.label} — ${d.detail}`);
    }
    console.log("\n  Top fixes:");
    for (const f of r.fixes.slice(0, 6)) {
      console.log(`    [${f.priority.toUpperCase()}] ${f.text}`);
    }
    console.log();
  } catch (e) {
    if (e instanceof GitHubError) {
      console.error(`\n  ${e.message}\n`);
      process.exit(2);
    }
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
