import { useMemo, useState } from "react";
import { split, Stage } from "./Stage";

type Stat = { key: string; label: string; fn: (x: number, y: number) => number };

const STATS: Stat[] = [
  { key: "sum", label: "Sum", fn: (x, y) => x + y },
  { key: "prod", label: "Product", fn: (x, y) => x * y },
  { key: "min", label: "Min", fn: (x, y) => Math.min(x, y) },
  { key: "max", label: "Max", fn: (x, y) => Math.max(x, y) },
  { key: "diff", label: "|Difference|", fn: (x, y) => Math.abs(x - y) },
];

const DEFAULT = [1, 2, 3, 4, 5, 6];

/** Exact distribution of a statistic over the 36 equally likely face pairs. */
function exact(fa: number[], fb: number[], fn: Stat["fn"]) {
  const p = new Map<number, number>();
  for (const x of fa) for (const y of fb) p.set(fn(x, y), (p.get(fn(x, y)) ?? 0) + 1 / 36);
  const values = Array.from(p.keys()).sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v * p.get(v)!, 0);
  const variance = values.reduce((s, v) => s + (v - mean) ** 2 * p.get(v)!, 0);
  return { p, values, mean, variance, sd: Math.sqrt(variance) };
}

/**
 * Relabel the faces of two dice, pick a statistic, and compare its exact
 * distribution with rolls. The band marks mean ± one standard deviation.
 */
function DiceStats() {
  const [stat, setStat] = useState(STATS[0]);
  const [fa, setFa] = useState(DEFAULT);
  const [fb, setFb] = useState(DEFAULT);
  const [rolls, setRolls] = useState<[number, number][]>([]);
  const theory = useMemo(() => exact(fa, fb, stat.fn), [fa, fb, stat]);

  const counts = new Map<number, number>();
  rolls.forEach(([i, j]) => { const v = stat.fn(fa[i], fb[j]); counts.set(v, (counts.get(v) ?? 0) + 1); });
  const sample = rolls.map(([i, j]) => stat.fn(fa[i], fb[j]));
  const sMean = sample.length ? sample.reduce((s, v) => s + v, 0) / sample.length : 0;
  const maxP = Math.max(...Array.from(theory.p.values()));
  const last = rolls[rolls.length - 1];
  const lo = theory.values[0];
  const hi = theory.values[theory.values.length - 1];
  const pct = (v: number) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);

  const relabel = (which: "a" | "b", k: number, raw: string) => {
    const v = Math.max(-9, Math.min(20, parseInt(raw, 10) || 0));
    (which === "a" ? setFa : setFb)((faces) => faces.map((f, i) => (i === k ? v : f)));
    setRolls([]);
  };
  const add = (k: number) =>
    setRolls((r) => [...r, ...Array.from({ length: k }, () => [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)] as [number, number])]);

  return (
    <div className="viz viz-dice">
      <div className="viz-row viz-chips">
        {STATS.map((s) => <button key={s.key} className={`chip ${s.key === stat.key ? "is-on" : ""}`} onClick={() => setStat(s)}>{s.label}</button>)}
      </div>

      <div className="relabel">
        {(["a", "b"] as const).map((which) => (
          <div key={which} className="relabel-row">
            <span className="chip-label">Die {which.toUpperCase()}</span>
            {(which === "a" ? fa : fb).map((f, k) => (
              <input
                key={k}
                className={`face-input mono ${last && last[which === "a" ? 0 : 1] === k ? "is-rolled" : ""}`}
                value={f}
                inputMode="numeric"
                aria-label={`Die ${which.toUpperCase()} face ${k + 1}`}
                onChange={(e) => relabel(which, k, e.target.value)}
              />
            ))}
          </div>
        ))}
        <button className="chip chip-sm" onClick={() => { setFa(DEFAULT); setFb(DEFAULT); setRolls([]); }}>Standard faces</button>
      </div>

      <div className="sq-actions">
        <button className="btn" onClick={() => add(1)}>Roll</button>
        <button className="btn btn-soft" onClick={() => add(100)}>Roll ×100</button>
        <button className="btn btn-ghost" onClick={() => setRolls([])}>Reset</button>
        {last && <span className="mips-count mono">{fa[last[0]]} and {fb[last[1]]} → {stat.fn(fa[last[0]], fb[last[1]])}</span>}
      </div>

      <Stage>
      <div className="hist-wrap">
        <span className="sd-band" style={{ left: `${pct(theory.mean - theory.sd)}%`, width: `${pct(theory.mean + theory.sd) - pct(theory.mean - theory.sd)}%` }} aria-hidden />
        <span className="sd-mean" style={{ left: `${pct(theory.mean)}%` }} aria-hidden />
        <div className="hist" role="img" aria-label="Exact versus observed distribution">
          {theory.values.map((v) => {
            const obs = rolls.length ? (counts.get(v) ?? 0) / rolls.length : 0;
            return (
              <div key={v} className="hist-col">
                <div className="hist-bars">
                  <span className="hist-exact" style={{ height: `${(theory.p.get(v)! / maxP) * 100}%` }} />
                  <span className="hist-obs" style={{ height: `${Math.min(obs / maxP, 1.15) * 100}%` }} />
                </div>
                <span className="hist-x">{v}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="viz-legend">
        <span><i className="sw sw-exact" /> exact</span>
        <span><i className="sw sw-obs" /> observed ({rolls.length})</span>
        <span><i className="sw sw-band" /> μ ± σ</span>
      </div>
      <p className="viz-readout mono">
        E[X] = {theory.mean.toFixed(3)} · Var = {theory.variance.toFixed(3)} · σ = <strong>{theory.sd.toFixed(3)}</strong>
        {rolls.length ? ` · sample mean ${sMean.toFixed(3)}` : ""}
      </p>
      </Stage>
    </div>
  );
}

export default split(DiceStats);
