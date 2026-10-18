import { useState } from "react";

type Curve = { key: string; label: string; f: (n: number) => number };

const CURVES: Curve[] = [
  { key: "1", label: "1", f: () => 1 },
  { key: "log", label: "log n", f: (n) => Math.log2(Math.max(n, 1)) },
  { key: "n", label: "n", f: (n) => n },
  { key: "nlog", label: "n log n", f: (n) => n * Math.log2(Math.max(n, 1)) },
  { key: "n2", label: "n²", f: (n) => n * n },
  { key: "n3", label: "n³", f: (n) => n ** 3 },
  { key: "2n", label: "2ⁿ", f: (n) => 2 ** n },
];

const W = 400;
const H = 220;

/** Drag n and see which growth rates explode first. */
export default function GrowthRates() {
  const [n, setN] = useState(16);
  const [on, setOn] = useState<Set<string>>(new Set(["log", "n", "nlog", "n2", "2n"]));
  const shown = CURVES.filter((c) => on.has(c.key));
  // Scale the y axis to the largest visible n² so 2ⁿ visibly shoots off the chart.
  const yMax = Math.max(n * n, 8);

  const path = (c: Curve) =>
    Array.from({ length: 61 }, (_, k) => {
      const x = (k / 60) * n;
      const y = Math.min(c.f(x) / yMax, 1.2);
      return `${k ? "L" : "M"} ${(k / 60) * W} ${H - y * H}`;
    }).join(" ");

  const toggle = (k: string) => {
    const next = new Set(on);
    next.has(k) ? next.delete(k) : next.add(k);
    setOn(next);
  };

  return (
    <div className="viz viz-growth">
      <div className="viz-row viz-chips">
        {CURVES.map((c, i) => (
          <button
            key={c.key}
            className={`chip chip-series ${on.has(c.key) ? "is-on" : ""}`}
            style={{ ["--series" as string]: `var(--s${i})` }}
            aria-pressed={on.has(c.key)}
            onClick={() => toggle(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <svg viewBox={`0 -8 ${W} ${H + 16}`} className="growth-svg" role="img" aria-label="Growth rate curves">
        <line x1="0" y1={H} x2={W} y2={H} className="axis" />
        <line x1="0" y1="0" x2="0" y2={H} className="axis" />
        <clipPath id="growth-clip"><rect x="0" y="-8" width={W} height={H + 8} /></clipPath>
        <g clipPath="url(#growth-clip)">
          {shown.map((c) => (
            <path
              key={c.key}
              d={path(c)}
              className="growth-line"
              style={{ stroke: `var(--s${CURVES.indexOf(c)})` }}
            />
          ))}
        </g>
      </svg>

      <label className="growth-n">
        n = <strong>{n}</strong>
        <input type="range" min={2} max={40} value={n} onChange={(e) => setN(+e.target.value)} />
      </label>

      <div className="growth-table">
        {shown.map((c) => (
          <div key={c.key}>
            <span style={{ color: `var(--s${CURVES.indexOf(c)})` }}>●</span> {c.label}
            <strong>{Math.round(c.f(n)).toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
