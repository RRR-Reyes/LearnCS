import { useState } from "react";
import { split, Stage } from "./Stage";
import { evaluate, rowsFor, show, steps, varsOf } from "./logic/prop";
import { ExprField, Keypad, pressKey, useExpr } from "./logic/ExprInput";

const PRESETS = ["P → Q", "¬(P ∧ Q)", "(P ∧ Q) ∨ ¬R", "P ⊕ Q ⊕ R", "(P → Q) ∧ (Q → R)"];
const MAX_VARS = 4;
const tf = (b: boolean) => (b ? "T" : "F");
const SUP = "⁰¹²³⁴";

/**
 * Build any truth table: type an expression (or tap symbols), and the table
 * gets one column per operator, innermost first, ending with the answer.
 */
function TruthTable() {
  const expr = useExpr("(P ∧ Q) ∨ ¬R");
  const [showSteps, setShowSteps] = useState(true);
  const [active, setActive] = useState(0);

  const node = expr.node;
  const vars = node ? varsOf(node) : [];
  const tooMany = vars.length > MAX_VARS;
  const ok = node && !tooMany;
  const cols = ok ? (showSteps ? steps(node) : [node]) : [];
  const rows = ok ? rowsFor(vars) : [];
  const results = ok ? rows.map((env) => evaluate(node, env)) : [];
  const trueCount = results.filter(Boolean).length;
  const row = Math.min(active, Math.max(0, rows.length - 1));

  return (
    <div className="viz lt">
      <ExprField expr={expr} />
      {tooMany && <p className="lk-error">Use at most {MAX_VARS} variables, so the table stays at 16 rows.</p>}
      <Keypad onKey={(k) => pressKey(expr, k)} />
      <div className="viz-row viz-chips">
        <span className="chip-label">Try</span>
        {PRESETS.map((p) => (
          <button key={p} className={`chip chip-sm mono ${expr.text === p ? "is-on" : ""}`} onClick={() => expr.setText(p)}>
            {p}
          </button>
        ))}
      </div>

      <Stage>
        {ok ? (
          <>
            <div className="lt-head">
              <strong className="mono">{show(node)}</strong>
              <label className="lt-toggle">
                <input type="checkbox" checked={showSteps} onChange={(e) => setShowSteps(e.target.checked)} /> Show every step
              </label>
            </div>
            <div className="lt-scroll">
              <table className="lt-table">
                <thead>
                  <tr>
                    {vars.map((v) => <th key={v} className="is-input">{v}</th>)}
                    {cols.map((c, k) => (
                      <th key={k} className={`mono ${k === cols.length - 1 ? "is-final" : "is-step"}`}>
                        {cols.length > 1 && k < cols.length - 1 && <small>step {k + 1}</small>}
                        {show(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((env, i) => (
                    <tr key={i} className={i === row ? "is-active" : ""} onClick={() => setActive(i)}>
                      {vars.map((v) => <td key={v} className="is-input">{tf(env[v])}</td>)}
                      {cols.map((c, k) => {
                        const val = evaluate(c, env);
                        return (
                          <td key={k} className={`${k === cols.length - 1 ? "is-final" : "is-step"} ${val ? "is-t" : "is-f"}`}>
                            {tf(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="viz-readout">
              {vars.length === 0 ? "No variables, so there is just one row. " : `${vars.length} variable${vars.length > 1 ? "s" : ""} → 2${SUP[vars.length]} = ${rows.length} rows. `}
              True in {trueCount} of {rows.length}:{" "}
              <strong>{trueCount === rows.length ? "a tautology" : trueCount === 0 ? "a contradiction" : "a contingency"}</strong>.
            </p>
          </>
        ) : (
          <p className="viz-readout">Fix the expression on the left and the table will appear here.</p>
        )}
      </Stage>
    </div>
  );
}

export default split(TruthTable);
