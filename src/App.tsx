import { useEffect, useRef, useState } from "react";
import { fetchProfile, GitHubError } from "./github.js";
import { grade, type Report } from "./grader.js";

type Status = "idle" | "loading" | "done" | "error";

const gradeColor = (score: number) =>
  score >= 83 ? "var(--green)" : score >= 66 ? "var(--blue)" : score >= 52 ? "var(--amber)" : "var(--red)";

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const [offset, setOffset] = useState(C);
  const [shown, setShown] = useState(0);
  const color = gradeColor(score);

  useEffect(() => {
    const t = setTimeout(() => setOffset(C * (1 - score / 100)), 60);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1100);
      // ease-out for a lively count-up that settles on the real score
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [score, C]);

  return (
    <div className="ring">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle className="track" cx="48" cy="48" r={R} fill="none" strokeWidth="8" />
        <circle
          className="prog"
          cx="48"
          cy="48"
          r={R}
          fill="none"
          strokeWidth="8"
          stroke={color}
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="center">
        <div className="num" style={{ color }}>{shown}</div>
        <div className="grade">{grade}</div>
      </div>
    </div>
  );
}

function Dimensions({ report }: { report: Report }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 120);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="dims">
      {report.dimensions.map((d) => {
        const pct = (d.score / d.max) * 100;
        const color = pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--blue)" : pct >= 25 ? "var(--amber)" : "var(--red)";
        return (
          <div className="dim" key={d.key}>
            <div className="label">{d.label}</div>
            <div className="track">
              <div className="fill" style={{ width: on ? `${pct}%` : 0, background: color }} />
            </div>
            <div className="pts">{d.score}/{d.max}</div>
            <div className="detail">{d.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

export function App() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function run(name: string) {
    const clean = name.trim().replace(/^@/, "");
    if (!clean) return;
    setStatus("loading");
    setError("");
    setReport(null);
    try {
      const input = await fetchProfile(clean);
      const r = grade(input);
      setReport(r);
      setStatus("done");
      const url = new URL(window.location.href);
      url.searchParams.set("u", r.username);
      window.history.replaceState(null, "", url);
    } catch (e) {
      setStatus("error");
      setError(e instanceof GitHubError ? e.message : "Something went wrong. Try again.");
    }
  }

  // Grade from ?u= on load (shareable links).
  useEffect(() => {
    const u = new URLSearchParams(window.location.search).get("u");
    if (u) {
      setUsername(u);
      void run(u);
    }
  }, []);

  function share() {
    if (!report) return;
    const url = `${window.location.origin}${window.location.pathname}?u=${report.username}`;
    const text = `My GitHub profile scores ${report.score}/100 (${report.grade}) on gitgrade. Grade yours → ${url}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="brand"><span className="dot">$</span> gitgrade</div>
        <h1>Grade your <span className="g">GitHub profile</span></h1>
        <p className="sub">A recruiter reads your profile in 20 seconds. See the score they'd give it — and exactly what to fix. No login.</p>

        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            void run(username);
          }}
        >
          <label className="field">
            <span className="at">@</span>
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github username"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="GitHub username"
            />
          </label>
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? <span className="spinner" /> : "Grade"}
          </button>
        </form>

        {status === "error" && <div className="error">{error}</div>}
        {status === "idle" && (
          <div className="samples">
            Try: <button onClick={() => { setUsername("torvalds"); void run("torvalds"); }}>torvalds</button>·
            <button onClick={() => { setUsername("gaearon"); void run("gaearon"); }}>gaearon</button>·
            <button onClick={() => { setUsername("LAVYA255"); void run("LAVYA255"); }}>LAVYA255</button>
          </div>
        )}
      </header>

      {status === "done" && report && (
        <div className="report">
          <div className="card">
            <div className="top">
              <img src={report.avatar} alt={report.username} />
              <div className="who">
                <div className="name">{report.name}</div>
                <div className="handle">@{report.username}</div>
                <div className="summary">{report.summary}</div>
              </div>
              <ScoreRing score={report.score} grade={report.grade} />
            </div>
            <Dimensions report={report} />
          </div>

          <div className="fixes">
            <h3>What to fix, in order</h3>
            {report.fixes.length === 0 && <div className="hint">Nothing major — this profile is in great shape. 🎉</div>}
            {report.fixes.map((f, i) => (
              <div className="fix" key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <span className={`tag ${f.priority}`}>{f.priority}</span>
                <span className="txt">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="actions">
            <button onClick={share}>{copied ? "Copied!" : "Share my score"}</button>
            <a href={`https://github.com/${report.username}`} target="_blank" rel="noreferrer">View profile ↗</a>
            <button onClick={() => { setStatus("idle"); setReport(null); setUsername(""); inputRef.current?.focus(); }}>
              Grade another
            </button>
          </div>
        </div>
      )}

      <footer>
        Deterministic, open scoring · runs entirely in your browser via the public GitHub API ·{" "}
        <a href="https://github.com/LAVYA255/gitgrade" target="_blank" rel="noreferrer">source</a>
      </footer>
    </div>
  );
}
