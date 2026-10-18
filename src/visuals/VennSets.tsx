import { useMemo, useState } from "react";

type Mode = "union" | "inter" | "aMinusB" | "bMinusA" | "sym";

const MODES: { key: Mode; label: string; test: (a: boolean, b: boolean) => boolean }[] = [
  { key: "union", label: "A ∪ B", test: (a, b) => a || b },
  { key: "inter", label: "A ∩ B", test: (a, b) => a && b },
  { key: "aMinusB", label: "A − B", test: (a, b) => a && !b },
  { key: "bMinusA", label: "B − A", test: (a, b) => b && !a },
  { key: "sym", label: "A ⊕ B", test: (a, b) => a !== b },
];

const UNIVERSE = Array.from({ length: 10 }, (_, i) => i + 1);

/** Where each element sits: only A, both, only B, or neither. */
const regionOf = (inA: boolean, inB: boolean) =>
  inA && inB ? "both" : inA ? "a" : inB ? "b" : "out";

const REGION_X: Record<string, number> = { a: 120, both: 210, b: 300, out: 210 };

export default function VennSets() {
  const [a, setA] = useState<Set<number>>(new Set([1, 2, 3, 5, 8]));
  const [b, setB] = useState<Set<number>>(new Set([2, 4, 6, 8, 10]));
  const [mode, setMode] = useState<Mode>("union");
  const test = MODES.find((m) => m.key === mode)!.test;

  const toggle = (which: "a" | "b", n: number) => {
    const set = which === "a" ? a : b;
    const next = new Set(set);
    next.has(n) ? next.delete(n) : next.add(n);
    which === "a" ? setA(next) : setB(next);
  };

  const result = UNIVERSE.filter((n) => test(a.has(n), b.has(n)));

  // Lay elements out inside their region on a small grid so none overlap.
  const placed = useMemo(() => {
    const counts: Record<string, number> = {};
    return UNIVERSE.map((n) => {
      const r = regionOf(a.has(n), b.has(n));
      const i = (counts[r] = (counts[r] ?? -1) + 1);
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = r === "out" ? 40 + i * 34 : REGION_X[r] + (col - 0.5) * 30;
      const y = r === "out" ? 232 : 88 + row * 30;
      return { n, r, x, y };
    });
  }, [a, b]);

  return (
    <div className="viz viz-venn">
      <div className="viz-row viz-chips" role="radiogroup" aria-label="Operation">
        {MODES.map((m) => (
          <button
            key={m.key}
            role="radio"
            aria-checked={m.key === mode}
            className={`chip ${m.key === mode ? "is-on" : ""}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 420 256" className="venn-svg" role="img" aria-label="Venn diagram of sets A and B">
        <defs>
          <clipPath id="clipA">
            <circle cx="160" cy="118" r="92" />
          </clipPath>
        </defs>
        {/* Shade each of the three regions when the operation includes it. */}
        <circle cx="160" cy="118" r="92" className={`venn-fill ${test(true, false) ? "is-on" : ""}`} />
        <circle cx="260" cy="118" r="92" className={`venn-fill ${test(false, true) ? "is-on" : ""}`} />
        <circle
          cx="260"
          cy="118"
          r="92"
          clipPath="url(#clipA)"
          className={`venn-fill venn-mid ${test(true, true) ? "is-on" : "is-off"}`}
        />
        <circle cx="160" cy="118" r="92" className="venn-ring" />
        <circle cx="260" cy="118" r="92" className="venn-ring" />
        <text x="96" y="40" className="venn-label">A</text>
        <text x="316" y="40" className="venn-label">B</text>
        {placed.map((p) => (
          <g
            key={p.n}
            className={`venn-dot ${result.includes(p.n) ? "is-hit" : ""}`}
            style={{ transform: `translate(${p.x}px, ${p.y}px)` }}
          >
            <circle r="12" />
            <text dy="4">{p.n}</text>
          </g>
        ))}
      </svg>

      <div className="venn-pickers">
        {(["a", "b"] as const).map((which) => (
          <div key={which} className="venn-picker">
            <span className="venn-picker-name">{which.toUpperCase()}</span>
            {UNIVERSE.map((n) => {
              const on = (which === "a" ? a : b).has(n);
              return (
                <button
                  key={n}
                  className={`num ${on ? "is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() => toggle(which, n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p className="viz-readout">
        {MODES.find((m) => m.key === mode)!.label} = {"{"}
        {result.join(", ")}
        {"}"} &nbsp;·&nbsp; |result| = {result.length} &nbsp;·&nbsp; |𝒫(A)| = 2
        <sup>{a.size}</sup> = {2 ** a.size}
      </p>
    </div>
  );
}
