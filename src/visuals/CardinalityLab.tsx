import { useState } from "react";
import { split, Stage } from "./Stage";

/** Region sizes keyed by code (bit 4 = A, 2 = B, 1 = C). */
type Counts = Record<number, number>;
const START: Counts = { 4: 3, 2: 2, 1: 2, 6: 1, 5: 1, 3: 2, 7: 1 };
const REGION_NAMES: [number, string][] = [[4, "A only"], [2, "B only"], [1, "C only"], [6, "A∩B only"], [5, "A∩C only"], [3, "B∩C only"], [7, "A∩B∩C"]];
/** Each inclusion–exclusion term counts the regions containing all of its sets. */
const TERM_MASKS = [4, 2, 1, 6, 5, 3, 7];
const CIRCLE: Record<string, [number, number]> = { A: [175, 150], B: [285, 150], C: [230, 245] };
const SPOT: Record<number, [number, number]> = { 4: [125, 120], 2: [335, 120], 1: [230, 300], 6: [230, 108], 5: [178, 218], 3: [282, 218], 7: [230, 178] };

/** Adjust region sizes and watch inclusion–exclusion rebuild |A ∪ B ∪ C|; grow a set to see 2ⁿ subsets. */
function CardinalityLab() {
  const [counts, setCounts] = useState<Counts>(START);
  const [n, setN] = useState(3);
  const [step, setStep] = useState(7);

  const sum = (test: (c: number) => boolean) => REGION_NAMES.reduce((t, [c]) => t + (test(c) ? counts[c] : 0), 0);
  const terms: [string, number, 1 | -1][] = [
    ["|A|", sum((c) => (c & 4) > 0), 1],
    ["|B|", sum((c) => (c & 2) > 0), 1],
    ["|C|", sum((c) => (c & 1) > 0), 1],
    ["|A∩B|", sum((c) => (c & 6) === 6), -1],
    ["|A∩C|", sum((c) => (c & 5) === 5), -1],
    ["|B∩C|", sum((c) => (c & 3) === 3), -1],
    ["|A∩B∩C|", counts[7], 1],
  ];
  const running = terms.slice(0, step).reduce((t, [, v, s]) => t + s * v, 0);
  const truth = sum(() => true);

  const letters = ["a", "b", "c", "d", "e"].slice(0, n);
  const subsets = Array.from({ length: 1 << n }, (_, m) => letters.filter((_, i) => m & (1 << i)))
    .sort((x, y) => x.length - y.length);

  const bump = (c: number, d: number) => setCounts({ ...counts, [c]: Math.max(0, Math.min(9, counts[c] + d)) });

  return (
    <div className="viz viz-card">
      <div className="card-regions">
        {REGION_NAMES.map(([c, name]) => (
          <div key={c} className="card-region">
            <span>{name}</span>
            <button className="icon-btn" aria-label={`Fewer in ${name}`} onClick={() => bump(c, -1)}>−</button>
            <strong className="mono">{counts[c]}</strong>
            <button className="icon-btn" aria-label={`More in ${name}`} onClick={() => bump(c, 1)}>+</button>
          </div>
        ))}
      </div>
      <div className="sq-actions">
        <button className="btn btn-soft" onClick={() => setStep(Math.max(1, step - 1))} disabled={step <= 1}>Back</button>
        <button className="btn" onClick={() => setStep(Math.min(7, step + 1))} disabled={step >= 7}>Add next term</button>
        <span className="mips-count">{step === 7 ? `matches the ${truth} elements in the regions ✓` : `${7 - step} terms to go`}</span>
      </div>
      <div className="viz-row viz-chips">
        <span className="chip-label">Power set of</span>
        {[1, 2, 3, 4, 5].map((k) => (
          <button key={k} className={`chip chip-sm ${k === n ? "is-on" : ""}`} onClick={() => setN(k)}>n = {k}</button>
        ))}
      </div>

      <Stage>
      {/* The latest term's circles are drawn bold and the regions it counts are filled. */}
      <svg viewBox="0 0 460 380" className="card-venn" role="img" aria-label="Venn diagram with the number of elements in each region">
        {Object.entries(CIRCLE).map(([k, [x, y]], i) => (
          <g key={k}>
            <circle cx={x} cy={y} r={95} className={`card-ring ${TERM_MASKS[step - 1] & (4 >> i) ? "is-term" : ""}`} />
            <text x={x + (i === 0 ? -88 : i === 1 ? 78 : 0)} y={y + (i === 2 ? 118 : -84)} className="venn-label">{k}</text>
          </g>
        ))}
        {REGION_NAMES.map(([c]) => {
          const m = TERM_MASKS[step - 1];
          return (
            <g key={c} className={`card-count ${(c & m) === m ? "is-term" : ""}`} transform={`translate(${SPOT[c][0]} ${SPOT[c][1]})`}>
              <circle r={17} />
              <text dy={6}>{counts[c]}</text>
            </g>
          );
        })}
      </svg>

      <div className="ie-terms" aria-live="polite">
        {terms.map(([label, v, s], i) => (
          <span key={label} className={`ie-term mono ${s > 0 ? "is-plus" : "is-minus"} ${i < step ? "is-on" : ""}`}>
            {i === 0 ? "" : s > 0 ? "+ " : "− "}{label} {v}
          </span>
        ))}
        <span className="ie-total mono">= {running}</span>
      </div>

      <div className="ps">
        <span className="chip-label">Power set of <strong className="mono">{`{${letters.join(", ")}}`}</strong></span>
        <div className="ps-chips" key={n}>
          {subsets.map((s, i) => (
            <span key={s.join("")} className="mono pop" style={{ animationDelay: `${i * 22}ms` }}>{s.length ? `{${s.join(", ")}}` : "∅"}</span>
          ))}
        </div>
        <p className="viz-readout">|𝒫(S)| = 2<sup>{n}</sup> = {1 << n}. Each element is either in a subset or out, so the count doubles per element.</p>
      </div>
      </Stage>
    </div>
  );
}

export default split(CardinalityLab);
