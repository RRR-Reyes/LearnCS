import { useState } from "react";

type Expr = { label: string; vars: 2 | 3; fn: (p: boolean, q: boolean, r: boolean) => boolean };

const EXPRS: Expr[] = [
  { label: "P ∧ Q", vars: 2, fn: (p, q) => p && q },
  { label: "P ∨ Q", vars: 2, fn: (p, q) => p || q },
  { label: "¬(P ∧ Q)  NAND", vars: 2, fn: (p, q) => !(p && q) },
  { label: "¬(P ∨ Q)  NOR", vars: 2, fn: (p, q) => !(p || q) },
  { label: "P ⊕ Q", vars: 2, fn: (p, q) => p !== q },
  { label: "P ↔ Q", vars: 2, fn: (p, q) => p === q },
  { label: "P → Q", vars: 2, fn: (p, q) => !p || q },
  { label: "(P ∧ Q) ∨ ¬R", vars: 3, fn: (p, q, r) => (p && q) || !r },
  { label: "(P → Q) ∧ (Q → R)", vars: 3, fn: (p, q, r) => (!p || q) && (!q || r) },
  { label: "P ⊕ Q ⊕ R", vars: 3, fn: (p, q, r) => (p !== q) !== r },
  { label: "¬P ∨ (Q ∧ R)", vars: 3, fn: (p, q, r) => !p || (q && r) },
];

const tf = (b: boolean) => (b ? "T" : "F");

/** Rows in standard textbook order: TT…T first, FF…F last. */
const rowsFor = (n: number) =>
  Array.from({ length: 2 ** n }, (_, i) => Array.from({ length: n }, (_, k) => !((i >> (n - 1 - k)) & 1)));

/** Flip the switches or click a row; the table and bulb show the chosen expression. */
export default function TruthTable() {
  const [expr, setExpr] = useState(EXPRS[0]);
  const [vals, setVals] = useState([true, false, true]);
  const n = expr.vars;
  const names = ["P", "Q", "R"].slice(0, n);
  const out = expr.fn(vals[0], vals[1], vals[2]);
  const rows = rowsFor(n);
  const trueCount = rows.filter((r) => expr.fn(r[0], r[1], r[2] ?? false)).length;

  return (
    <div className="viz viz-truth">
      <div className="viz-row viz-chips" role="radiogroup" aria-label="Expression">
        {EXPRS.map((e) => (
          <button
            key={e.label}
            role="radio"
            aria-checked={e === expr}
            className={`chip chip-sm mono ${e === expr ? "is-on" : ""}`}
            onClick={() => setExpr(e)}
          >
            {e.label}
          </button>
        ))}
      </div>

      <div className="truth-stage">
        {names.map((name, k) => (
          <button
            key={name}
            className={`switch ${vals[k] ? "is-on" : ""}`}
            onClick={() => setVals(vals.map((v, j) => (j === k ? !v : v)))}
            aria-pressed={vals[k]}
          >
            <span className="switch-name">{name}</span>
            <span className="switch-track"><span className="switch-knob" /></span>
            <span className="switch-val">{tf(vals[k])}</span>
          </button>
        ))}
        <div className="truth-wire" aria-hidden />
        <div className={`bulb ${out ? "is-on" : ""}`} aria-live="polite">
          <span className="bulb-label mono">{expr.label.split("  ")[0]}</span>
          <strong>{tf(out)}</strong>
        </div>
      </div>

      <table className="truth-table" key={expr.label}>
        <thead>
          <tr>
            {names.map((x) => <th key={x}>{x}</th>)}
            <th className="mono">{expr.label.split("  ")[0]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const v = expr.fn(r[0], r[1], r[2] ?? false);
            const active = r.every((b, k) => b === vals[k]);
            return (
              <tr
                key={i}
                className={`truth-row ${active ? "is-active" : ""}`}
                style={{ animationDelay: `${i * 45}ms` }}
                onClick={() => setVals([r[0], r[1], r[2] ?? vals[2]])}
              >
                {r.map((b, k) => <td key={k}>{tf(b)}</td>)}
                <td className={v ? "is-true" : "is-false"}>{tf(v)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="viz-readout">
        True in {trueCount} of {rows.length} rows
        {trueCount === rows.length ? " · a tautology" : trueCount === 0 ? " · a contradiction" : ""}
      </p>
    </div>
  );
}
