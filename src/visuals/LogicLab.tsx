import { useState } from "react";
import { split, Stage } from "./Stage";
import { dual, evaluate, negate, onlyAndOrNot, pushNot, rowsFor, show, varsOf } from "./logic/prop";
import type { Node } from "./logic/prop";
import { ExprField, Keypad, pressKey, useExpr } from "./logic/ExprInput";
import type { ExprState } from "./logic/ExprInput";
import { tryCompile } from "./logic/pred";
import { Tex } from "../components/MathText";

const tf = (b: boolean) => (b ? "T" : "F");

const LAWS: { name: string; a: string; b: string }[] = [
  { name: "De Morgan (∧)", a: "¬(P ∧ Q)", b: "¬P ∨ ¬Q" },
  { name: "De Morgan (∨)", a: "¬(P ∨ Q)", b: "¬P ∧ ¬Q" },
  { name: "Absorption", a: "P ∨ (P ∧ Q)", b: "P" },
  { name: "Distributive", a: "P ∧ (Q ∨ R)", b: "(P ∧ Q) ∨ (P ∧ R)" },
  { name: "Implication", a: "P → Q", b: "¬P ∨ Q" },
  { name: "Contrapositive", a: "P → Q", b: "¬Q → ¬P" },
  { name: "Converse (trap)", a: "P → Q", b: "Q → P" },
  { name: "Common mistake", a: "¬(P ∧ Q)", b: "¬P ∧ ¬Q" },
];

const kindOf = (node: Node, vars: string[]) => {
  const n = rowsFor(vars).filter((env) => evaluate(node, env)).length;
  return n === 2 ** vars.length ? "tautology" : n === 0 ? "contradiction" : "contingency";
};

/** Two expressions side by side. Rewrite either with a law and see whether the columns still match. */
function Equivalence() {
  const a = useExpr("¬(P ∧ Q)");
  const b = useExpr("¬P ∨ ¬Q");
  const [focus, setFocus] = useState<0 | 1>(0);
  const [note, setNote] = useState<string | null>(null);
  const fields: [ExprState, ExprState] = [a, b];
  const cur = fields[focus];
  const name = focus === 0 ? "A" : "B";

  const apply = (fn: (n: Node) => { node: Node; note: string } | string) => {
    if (!cur.node) return setNote(`Fix ${name} first.`);
    const r = fn(cur.node);
    if (typeof r === "string") return setNote(r);
    cur.setText(show(r.node));
    setNote(`${name}: ${r.note}`);
  };

  const ok = a.node && b.node;
  const vars = ok ? varsOf({ t: "bin", op: "∧", a: a.node!, b: b.node! }) : [];
  const rows = ok && vars.length <= 4 ? rowsFor(vars) : [];
  const bad = rows.findIndex((env) => evaluate(a.node!, env) !== evaluate(b.node!, env));

  return (
    <>
      <div className="viz-row viz-chips">
        <span className="chip-label">Load a law</span>
        {LAWS.map((l) => (
          <button
            key={l.name}
            className={`chip chip-sm ${a.text === l.a && b.text === l.b ? "is-on" : ""}`}
            onClick={() => {
              a.setText(l.a);
              b.setText(l.b);
              setNote(null);
            }}
          >
            {l.name}
          </button>
        ))}
      </div>

      <ExprField expr={a} label="A" active={focus === 0} onFocus={() => setFocus(0)} />
      <ExprField expr={b} label="B" active={focus === 1} onFocus={() => setFocus(1)} />
      <Keypad onKey={(k) => pressKey(cur, k)} />

      <div className="lk-actions">
        <span className="chip-label">Change {name}</span>
        <button className="chip" onClick={() => apply((n) => {
            const r = pushNot(n);
            return r ? { node: r.node, note: `applied ${r.law}` } : "Every ¬ already sits on a single variable.";
          })}>
          Push ¬ in one step
        </button>
        <button className="chip" onClick={() => apply((n) => ({ node: onlyAndOrNot(n), note: "rewritten with only ∧, ∨ and ¬ (same table)" }))}>
          Rewrite with ∧ ∨ ¬
        </button>
        <button className="chip" onClick={() => apply((n) => ({ node: negate(n), note: "negated: every row flips" }))}>
          Negate
        </button>
        <button
          className="chip"
          onClick={() =>
            apply((n) => {
              const d = dual(n);
              return d ? { node: d, note: "dual: ∧ and ∨ swapped, T and F swapped" } : "The dual is only defined for ∧, ∨ and ¬. Rewrite first.";
            })
          }
        >
          Dual
        </button>
      </div>
      {note && <p className="lk-note">{note}</p>}

      <Stage>
        {ok && rows.length ? (
          <>
            <div className="lt-scroll">
              <table className="lt-table">
                <thead>
                  <tr>
                    {vars.map((v) => <th key={v} className="is-input">{v}</th>)}
                    <th className="is-final mono"><small>A</small>{show(a.node!)}</th>
                    <th className="is-final mono"><small>B</small>{show(b.node!)}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((env, i) => {
                    const x = evaluate(a.node!, env);
                    const y = evaluate(b.node!, env);
                    return (
                      <tr key={i} className={x === y ? "" : "is-mismatch"}>
                        {vars.map((v) => <td key={v} className="is-input">{tf(env[v])}</td>)}
                        <td className={`is-final ${x ? "is-t" : "is-f"}`}>{tf(x)}</td>
                        <td className={`is-final ${y ? "is-t" : "is-f"}`}>{tf(y)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={`lk-verdict ${bad < 0 ? "is-eq" : "is-neq"}`} aria-live="polite">
              <strong><Tex tex={bad < 0 ? "A \\equiv B" : "A \\not\\equiv B"} /></strong>
              <span>
                {bad < 0
                  ? "They agree in every row, so they are equivalent."
                  : `They disagree when ${vars.map((v) => `${v} = ${tf(rows[bad][v])}`).join(", ")}: one counterexample is enough.`}
              </span>
            </div>
            <p className="viz-readout">
              A is a <strong>{kindOf(a.node!, vars)}</strong>, B is a <strong>{kindOf(b.node!, vars)}</strong>.
            </p>
          </>
        ) : (
          <p className="viz-readout">{ok ? "Use at most 4 variables." : "Fix the expressions on the left to compare them."}</p>
        )}
      </Stage>
    </>
  );
}

const PRED_PRESETS = ["x % 2 == 0", "x * x < 50", "x + y == 0", "x < y", "x * y == 0"];

/** Write a predicate, choose the quantifiers and the domain, and watch witnesses and counterexamples. */
function Quantifiers() {
  const [src, setSrc] = useState("x + y == 0");
  const [lo, setLo] = useState(-3);
  const [hi, setHi] = useState(3);
  const [qx, setQx] = useState<"∀" | "∃">("∀");
  const [qy, setQy] = useState<"∀" | "∃">("∃");
  const [yFirst, setYFirst] = useState(false);
  const [neg, setNeg] = useState(false);

  const { test, usesY, error } = tryCompile(src);
  const dom = Array.from({ length: Math.max(0, hi - lo + 1) }, (_, k) => lo + k);
  const flip = (q: "∀" | "∃") => (q === "∀" ? "∃" : "∀");

  // Outer and inner variables (inner only when the predicate mentions y).
  const outer = usesY && yFirst ? { v: "y", q: qy } : { v: "x", q: qx };
  const inner = usesY ? (yFirst ? { v: "x", q: qx } : { v: "y", q: qy }) : null;
  const at = (o: number, i: number) => (outer.v === "x" ? test!(o, i) : test!(i, o));

  const rowVal = (o: number) => (inner ? (inner.q === "∀" ? dom.every((i) => at(o, i)) : dom.some((i) => at(o, i))) : test!(o, 0));
  const rowVals = test ? dom.map(rowVal) : [];
  const base = outer.q === "∀" ? rowVals.every(Boolean) : rowVals.some(Boolean);
  const value = neg ? !base : base;
  const decider = outer.q === "∀" ? rowVals.findIndex((r) => !r) : rowVals.findIndex(Boolean);
  const innerDecider = (o: number) => {
    if (!inner) return -1;
    const cells = dom.map((i) => at(o, i));
    return inner.q === "∀" ? cells.findIndex((c) => !c) : cells.findIndex(Boolean);
  };

  const prefix = `${outer.q}${outer.v}${inner ? ` ${inner.q}${inner.v}` : ""}`;
  const stmt = `${prefix} (${src.trim()})`;
  const pushed = `${flip(outer.q)}${outer.v}${inner ? ` ${flip(inner.q)}${inner.v}` : ""} ¬(${src.trim()})`;

  return (
    <>
      <div className="lk-field">
        <span className="lk-label">P</span>
        <input className="lk-input" value={src} spellCheck={false} aria-label="Predicate" onChange={(e) => setSrc(e.target.value)} />
        {error && <span className="lk-error" role="status">{error}</span>}
      </div>
      <div className="viz-row viz-chips">
        <span className="chip-label">Try</span>
        {PRED_PRESETS.map((p) => (
          <button key={p} className={`chip chip-sm mono ${src === p ? "is-on" : ""}`} onClick={() => setSrc(p)}>{p}</button>
        ))}
      </div>
      <div className="lk-actions">
        <span className="chip-label">x</span>
        {(["∀", "∃"] as const).map((q) => (
          <button key={q} className={`chip ${qx === q ? "is-on" : ""}`} onClick={() => setQx(q)}>{q}x</button>
        ))}
        {usesY && (
          <>
            <span className="chip-label">y</span>
            {(["∀", "∃"] as const).map((q) => (
              <button key={q} className={`chip ${qy === q ? "is-on" : ""}`} onClick={() => setQy(q)}>{q}y</button>
            ))}
            <button className="chip" onClick={() => setYFirst(!yFirst)}>Swap order</button>
          </>
        )}
        <button className={`chip ${neg ? "is-on" : ""}`} onClick={() => setNeg(!neg)}>¬ negate</button>
      </div>
      <div className="lk-domain">
        <label>from <strong>{lo}</strong><input type="range" min={-6} max={12} value={lo} onChange={(e) => setLo(Math.min(+e.target.value, hi))} /></label>
        <label>to <strong>{hi}</strong><input type="range" min={-6} max={12} value={hi} onChange={(e) => setHi(Math.max(+e.target.value, lo))} /></label>
      </div>

      <Stage>
        {test ? (
          <>
            <p className="lq-stmt mono">{neg ? `¬${stmt}` : stmt}</p>
            <div className="lq-grid" role="table" aria-label="Predicate value for each domain element">
              {inner && (
                <div className="lq-row lq-axis" role="row">
                  <span className="lq-head">{outer.v} \ {inner.v}</span>
                  {dom.map((i) => <span key={i} className="lq-head">{i}</span>)}
                  <span className="lq-head" />
                </div>
              )}
              {inner ? (
                dom.map((o, r) => {
                  const d = innerDecider(o);
                  return (
                    <div key={o} className={`lq-row ${r === decider ? "is-decider" : ""}`} role="row">
                      <span className="lq-head">{o}</span>
                      {dom.map((i, c) => (
                        <span key={i} className={`lq-cell ${at(o, i) ? "is-t" : "is-f"} ${c === d ? "is-ring" : ""}`}>{at(o, i) ? "T" : "F"}</span>
                      ))}
                      <span className={`lq-mark ${rowVals[r] ? "is-t" : "is-f"}`}>{rowVals[r] ? "✓" : "✗"}</span>
                    </div>
                  );
                })
              ) : (
                <div className="lq-row lq-strip" role="row">
                  {dom.map((o, r) => (
                    <span key={o} className={`lq-cell ${rowVals[r] ? "is-t" : "is-f"} ${r === decider ? "is-ring" : ""}`}>
                      <small>{o}</small>{rowVals[r] ? "T" : "F"}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className={`lk-verdict ${value ? "is-eq" : "is-neq"}`} aria-live="polite">
              <strong>{value ? "True" : "False"}</strong>
              <span>
                {decider >= 0
                  ? `${outer.q === "∀" ? "Counterexample" : "Witness"}: ${outer.v} = ${dom[decider]} (ringed${inner ? " row" : ""}).`
                  : outer.q === "∀" ? `No counterexample: it holds for every ${outer.v}.` : `No witness: no ${outer.v} works.`}
                {inner && " Inside each row, the ring marks the " + (inner.q === "∃" ? `${inner.v} that works.` : `${inner.v} that breaks it.`)}
                {neg && ` Pushing ¬ inside flips each quantifier: ${pushed}.`}
              </span>
            </div>
          </>
        ) : (
          <p className="viz-readout">Fix the predicate on the left to see the domain.</p>
        )}
      </Stage>
    </>
  );
}

/** Equivalence by rewriting with laws, and quantifiers over a domain you choose. */
function LogicLab() {
  const [tab, setTab] = useState<"eq" | "quant">("eq");
  return (
    <div className="viz lt">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "eq"} className={tab === "eq" ? "is-on" : ""} onClick={() => setTab("eq")}>Equivalence</button>
        <button role="tab" aria-selected={tab === "quant"} className={tab === "quant" ? "is-on" : ""} onClick={() => setTab("quant")}>Quantifiers</button>
      </div>
      {tab === "eq" ? <Equivalence /> : <Quantifiers />}
    </div>
  );
}

export default split(LogicLab);
