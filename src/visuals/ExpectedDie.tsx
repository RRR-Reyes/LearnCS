import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { split, Stage } from "./Stage";

type Scenario = { label: string; values: number[]; weights: number[]; unit?: string };

const SCENARIOS: Scenario[] = [
  { label: "Fair die", values: [1, 2, 3, 4, 5, 6], weights: [1, 1, 1, 1, 1, 1] },
  { label: "Loaded die", values: [1, 2, 3, 4, 5, 6], weights: [1, 1, 1, 1, 1, 5] },
  { label: "Raffle ticket", values: [-2, 8, 48], weights: [93, 6, 1], unit: "$" },
  { label: "Marble bag", values: [0, 1, 5], weights: [5, 3, 2], unit: "pts" },
];

const BAR_H = 120;

/**
 * Drag each bar to set its probability, then roll. The running average of
 * the rolls drifts toward E[X], the probability-weighted mean. The controls
 * sit in the reading; the plot is drawn on the stage.
 */
function ExpectedDie() {
  const [sc, setSc] = useState(SCENARIOS[0]);
  const [weights, setWeights] = useState(sc.weights);
  const [rolls, setRolls] = useState<number[]>([]);
  const drag = useRef<number | null>(null);

  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const probs = weights.map((w) => w / total);
  const ev = sc.values.reduce((s, v, i) => s + v * probs[i], 0);
  const maxP = Math.max(...probs, 0.01);

  const choose = (s: Scenario) => { setSc(s); setWeights(s.weights); setRolls([]); };

  const sample = () => {
    let r = Math.random();
    for (let i = 0; i < probs.length; i++) { r -= probs[i]; if (r <= 0) return sc.values[i]; }
    return sc.values[sc.values.length - 1];
  };
  const roll = (k: number) => setRolls((rs) => [...rs, ...Array.from({ length: k }, sample)].slice(-2000));

  // Dragging a bar sets its weight from the pointer's height.
  const setFromPointer = (i: number, e: ReactPointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (box.bottom - e.clientY) / box.height));
    setWeights((ws) => ws.map((w, j) => (j === i ? Math.round(frac * 20) : w)));
    setRolls([]);
  };

  // Running mean after each roll, drawn as a line converging on E[X].
  const means: number[] = [];
  rolls.reduce((s, v, i) => { const t = s + v; means.push(t / (i + 1)); return t; }, 0);
  const lo = Math.min(...sc.values);
  const hi = Math.max(...sc.values);
  const W = 600;
  const H = 360;
  // The x-axis grows in steps of 100 rolls, like Seeing Theory's plot.
  const N = Math.max(100, Math.ceil(means.length / 100) * 100);
  const px = (i: number) => (i / (N - 1)) * W;
  const py = (v: number) => H - ((v - lo) / Math.max(1e-9, hi - lo)) * H;
  const last = means[means.length - 1];

  return (
    <div className="viz viz-ev">
      <div className="viz-row viz-chips">
        {SCENARIOS.map((s) => <button key={s.label} className={`chip ${s === sc ? "is-on" : ""}`} onClick={() => choose(s)}>{s.label}</button>)}
      </div>

      <div className="ev-bars" role="group" aria-label="Drag a bar to set its probability">
        {sc.values.map((v, i) => (
          <div key={`${sc.label}-${i}`} className="ev-col">
            <span className="ev-p mono">{probs[i].toFixed(2)}</span>
            <div
              className="ev-track"
              style={{ height: BAR_H }}
              onPointerDown={(e) => { drag.current = i; e.currentTarget.setPointerCapture(e.pointerId); setFromPointer(i, e); }}
              onPointerMove={(e) => drag.current === i && setFromPointer(i, e)}
              onPointerUp={() => (drag.current = null)}
              role="slider"
              aria-label={`Probability of ${v}`}
              aria-valuenow={Math.round(probs[i] * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                  e.preventDefault();
                  setWeights((ws) => ws.map((w, j) => (j === i ? Math.max(0, Math.min(20, w + (e.key === "ArrowUp" ? 1 : -1))) : w)));
                  setRolls([]);
                }
              }}
            >
              <span className="ev-fill" style={{ height: `${(probs[i] / maxP) * 100}%` }} />
            </div>
            <span className="ev-x mono">{sc.unit === "$" ? `$${v}` : v}</span>
          </div>
        ))}
      </div>

      <div className="sq-actions">
        <button className="btn" onClick={() => roll(1)}>Roll</button>
        <button className="btn btn-soft" onClick={() => roll(100)}>Roll ×100</button>
        <button className="btn btn-ghost" onClick={() => setRolls([])}>Reset</button>
        <span className="mips-count">{rolls.length} rolls{rolls.length ? ` · last ${rolls[rolls.length - 1]}` : ""}</span>
      </div>

      <Stage>
        <svg viewBox={`-44 -10 ${W + 56} ${H + 54}`} className="ev-plot" role="img" aria-label="Running average versus expected value">
          <line x1="0" y1="0" x2="0" y2={H} className="ev-axis" />
          <line x1="0" y1={H} x2={W} y2={H} className="ev-axis" />
          {[lo, (lo + hi) / 2, hi].map((v) => (
            <text key={v} x={-8} y={py(v) + 4} className="ev-tick" textAnchor="end">{+v.toFixed(1)}</text>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <text key={f} x={f * W} y={H + 18} className="ev-tick" textAnchor="middle">{Math.round(f * N)}</text>
          ))}
          <text x={W / 2} y={H + 42} className="ev-axis-label" textAnchor="middle">Number of rolls</text>
          <line x1="0" y1={py(ev)} x2={W} y2={py(ev)} className="ev-target" />
          <text x={W - 4} y={py(ev) - 8} className="ev-target-label">E[X] = {ev.toFixed(2)}</text>
          {means.length > 1 && <path className="ev-line" d={means.map((m, i) => `${i ? "L" : "M"} ${px(i)} ${py(m)}`).join(" ")} />}
        </svg>

        <p className="viz-readout mono" aria-live="polite">
          E[X] = {sc.values.map((v, i) => `${v}·${probs[i].toFixed(2)}`).join(" + ")} = <strong>{ev.toFixed(3)}</strong>
          <br />
          running average: {last === undefined ? "—" : last.toFixed(3)}
        </p>
      </Stage>
    </div>
  );
}

export default split(ExpectedDie);
