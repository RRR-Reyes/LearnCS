import { useState } from "react";
import { split, Stage } from "./Stage";

type F = (p: boolean, q: boolean) => boolean;
type Pair = { name: string; left: [string, F]; right: [string, F] };

const PAIRS: Pair[] = [
  { name: "De Morgan (∧)", left: ["¬(P ∧ Q)", (p, q) => !(p && q)], right: ["¬P ∨ ¬Q", (p, q) => !p || !q] },
  { name: "De Morgan (∨)", left: ["¬(P ∨ Q)", (p, q) => !(p || q)], right: ["¬P ∧ ¬Q", (p, q) => !p && !q] },
  { name: "Absorption", left: ["P ∨ (P ∧ Q)", (p, q) => p || (p && q)], right: ["P", (p) => p] },
  { name: "Implication", left: ["P → Q", (p, q) => !p || q], right: ["¬P ∨ Q", (p, q) => !p || q] },
  { name: "Contrapositive", left: ["P → Q", (p, q) => !p || q], right: ["¬Q → ¬P", (p, q) => q || !p] },
  { name: "Converse (trap)", left: ["P → Q", (p, q) => !p || q], right: ["Q → P", (p, q) => !q || p] },
  { name: "Common mistake", left: ["¬(P ∧ Q)", (p, q) => !(p && q)], right: ["¬P ∧ ¬Q", (p, q) => !p && !q] },
];

const SINGLES: [string, F][] = [
  ["P ∨ ¬P", (p) => p || !p],
  ["P ∧ ¬P", (p) => p && !p],
  ["(P → Q) ∨ (Q → P)", (p, q) => !p || q || !q || p],
  ["P → (P ∨ Q)", (p, q) => !p || p || q],
  ["P ∧ Q", (p, q) => p && q],
];

const ROWS: [boolean, boolean][] = [[true, true], [true, false], [false, true], [false, false]];
const tf = (b: boolean) => (b ? "T" : "F");

/** Predicates over a small domain for the quantifier tab. */
const DOMAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const PREDS: { label: string; fn: (x: number) => boolean }[] = [
  { label: "x is even", fn: (x) => x % 2 === 0 },
  { label: "x > 0", fn: (x) => x > 0 },
  { label: "x² < 50", fn: (x) => x * x < 50 },
  { label: "x is a multiple of 13", fn: (x) => x % 13 === 0 },
];

function Equivalence() {
  const [pair, setPair] = useState(PAIRS[0]);
  const [single, setSingle] = useState(SINGLES[0]);
  const same = ROWS.every(([p, q]) => pair.left[1](p, q) === pair.right[1](p, q));
  const singleCount = ROWS.filter(([p, q]) => single[1](p, q)).length;
  const kind = singleCount === 4 ? "Tautology" : singleCount === 0 ? "Contradiction" : "Contingency";

  return (
    <>
      <div className="viz-row viz-chips">
        {PAIRS.map((pr) => (
          <button key={pr.name} className={`chip chip-sm ${pr === pair ? "is-on" : ""}`} onClick={() => setPair(pr)}>{pr.name}</button>
        ))}
      </div>
      <div className="viz-row viz-chips">
        <span className="chip-label">Classify</span>
        {SINGLES.map((s) => (
          <button key={s[0]} className={`chip chip-sm mono ${s === single ? "is-on" : ""}`} onClick={() => setSingle(s)}>{s[0]}</button>
        ))}
      </div>

      <Stage>
      <table className="truth-table eq-table" key={pair.name}>
        <thead>
          <tr><th>P</th><th>Q</th><th className="mono">{pair.left[0]}</th><th className="mono">{pair.right[0]}</th></tr>
        </thead>
        <tbody>
          {ROWS.map(([p, q], i) => {
            const a = pair.left[1](p, q);
            const b = pair.right[1](p, q);
            return (
              <tr key={i} className={`truth-row ${a === b ? "" : "is-mismatch"}`} style={{ animationDelay: `${i * 60}ms` }}>
                <td>{tf(p)}</td><td>{tf(q)}</td>
                <td className={a ? "is-true" : "is-false"}>{tf(a)}</td>
                <td className={b ? "is-true" : "is-false"}>{tf(b)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className={`eq-lock ${same ? "is-locked" : "is-open"}`} aria-live="polite">
        <strong className="mono">{pair.left[0]} {same ? "≡" : "≢"} {pair.right[0]}</strong>
        <span>{same ? "Every row matches, so they are logically equivalent." : "A row disagrees (highlighted), so they are not equivalent."}</span>
      </div>

      <div className="eq-meter">
        <div className="meter-track" aria-hidden>
          {ROWS.map(([p, q], i) => <span key={i} className={single[1](p, q) ? "is-on" : ""} />)}
        </div>
        <p className="viz-readout">{single[0]} is true in {singleCount} of 4 rows → <strong>{kind}</strong></p>
      </div>
      </Stage>
    </>
  );
}

function Quantifiers() {
  const [pred, setPred] = useState(PREDS[0]);
  const [q, setQ] = useState<"forall" | "exists">("forall");
  const [neg, setNeg] = useState(false);
  const truths = DOMAIN.map(pred.fn);
  const base = q === "forall" ? truths.every(Boolean) : truths.some(Boolean);
  const value = neg ? !base : base;
  // The element that decides the answer: a counterexample for ∀, a witness for ∃.
  const decider = q === "forall" ? truths.findIndex((t) => !t) : truths.findIndex(Boolean);
  const stmt = `${q === "forall" ? "∀x" : "∃x"} (${pred.label})`;
  const pushed = `${q === "forall" ? "∃x" : "∀x"} ¬(${pred.label})`;

  return (
    <>
      <div className="viz-row viz-chips">
        {PREDS.map((p) => (
          <button key={p.label} className={`chip chip-sm ${p === pred ? "is-on" : ""}`} onClick={() => setPred(p)}>{p.label}</button>
        ))}
      </div>
      <div className="viz-row viz-chips">
        <button className={`chip ${q === "forall" ? "is-on" : ""}`} onClick={() => setQ("forall")}>∀ for all</button>
        <button className={`chip ${q === "exists" ? "is-on" : ""}`} onClick={() => setQ("exists")}>∃ there exists</button>
        <button className={`chip ${neg ? "is-on" : ""}`} onClick={() => setNeg(!neg)}>¬ negate</button>
      </div>
      <Stage>
      <div className="quant-grid" role="img" aria-label="Domain 1 to 12 with the predicate's truth for each">
        {DOMAIN.map((x, i) => (
          <span key={x} className={`quant-dot ${truths[i] ? "is-true" : "is-false"} ${i === decider ? "is-decider" : ""}`}>{x}</span>
        ))}
      </div>
      <div className={`eq-lock ${value ? "is-locked" : "is-open"}`} aria-live="polite">
        <strong className="mono">{neg ? `¬${stmt}` : stmt} is {value ? "True" : "False"}</strong>
        <span>
          {decider >= 0
            ? `${q === "forall" ? "Counterexample" : "Witness"}: x = ${DOMAIN[decider]} (ringed).`
            : q === "forall" ? "No counterexample exists in the domain." : "No witness exists in the domain."}
          {neg ? ` Pushing ¬ inside flips the quantifier: ${pushed}.` : ""}
        </span>
      </div>
      </Stage>
    </>
  );
}

/** Equivalence laws checked row by row, plus quantifiers over a visible domain. */
function LogicLab() {
  const [tab, setTab] = useState<"eq" | "quant">("eq");
  return (
    <div className="viz viz-logic">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "eq"} className={tab === "eq" ? "is-on" : ""} onClick={() => setTab("eq")}>Equivalence laws</button>
        <button role="tab" aria-selected={tab === "quant"} className={tab === "quant" ? "is-on" : ""} onClick={() => setTab("quant")}>Quantifiers</button>
      </div>
      {tab === "eq" ? <Equivalence /> : <Quantifiers />}
    </div>
  );
}

export default split(LogicLab);
