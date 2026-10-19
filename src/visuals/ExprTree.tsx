import { useMemo, useState } from "react";
import { split, Stage } from "./Stage";

type Val = number | boolean;
type Node = { id: number; op: string; kids: Node[]; value?: Val };

/** Python precedence, loosest first. `not` and unary minus are handled separately. */
const BINARY: string[][] = [["or"], ["and"], ["<", ">", "<=", ">=", "==", "!="], ["+", "-"], ["*", "/", "//", "%"]];

const tokenize = (src: string) =>
  src.match(/\d+(?:\.\d+)?|\*\*|\/\/|<=|>=|==|!=|and\b|or\b|not\b|[-+*/%<>()]/g) ?? [];

/** Recursive-descent parse into a tree whose nodes are operators or numbers. */
function parse(src: string): Node | null {
  const t = tokenize(src);
  let i = 0;
  let id = 0;
  const mk = (op: string, kids: Node[] = [], value?: Val): Node => ({ id: id++, op, kids, value });
  const level = (k: number): Node => {
    if (k === BINARY.length) return unary();
    let left = level(k + 1);
    while (BINARY[k].includes(t[i])) {
      const op = t[i++];
      left = mk(op, [left, level(k + 1)]);
    }
    return left;
  };
  const unary = (): Node => {
    if (t[i] === "not") { i++; return mk("not", [level(BINARY.findIndex((l) => l.includes("<")))]); }
    if (t[i] === "-") { i++; return mk("neg", [unary()]); }
    return power();
  };
  const power = (): Node => {
    const base = atom();
    // ** binds tighter than unary minus on its left and is right-associative.
    if (t[i] === "**") { i++; return mk("**", [base, unary()]); }
    return base;
  };
  const atom = (): Node => {
    if (t[i] === "(") { i++; const n = level(0); i++; return n; }
    const n = Number(t[i++]);
    return mk(String(n), [], n);
  };
  try {
    const root = level(0);
    return i === t.length ? root : null;
  } catch {
    return null;
  }
}

const num = (v: Val) => (typeof v === "boolean" ? (v ? 1 : 0) : v);
const pyMod = (a: number, b: number) => a - b * Math.floor(a / b);

function apply(op: string, a: Val, b?: Val): Val {
  const x = num(a);
  const y = b === undefined ? 0 : num(b);
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return x / y;
    case "//": return Math.floor(x / y);
    case "%": return pyMod(x, y);
    case "**": return x ** y;
    case "neg": return -x;
    case "<": return x < y;
    case ">": return x > y;
    case "<=": return x <= y;
    case ">=": return x >= y;
    case "==": return x === y;
    case "!=": return x !== y;
    case "not": return !a;
    default: return x;
  }
}

/** Evaluation order with short-circuiting: returns visited node ids in order and the skipped ones. */
function plan(root: Node) {
  const order: { id: number; value: Val; note: string }[] = [];
  /** Skipped node id → the step (1-based) at which its branch was short-circuited. */
  const skipped = new Map<number, number>();
  const skipAll = (n: Node) => { skipped.set(n.id, order.length + 1); n.kids.forEach(skipAll); };
  const ev = (n: Node): Val => {
    if (!n.kids.length) return n.value!;
    if (n.op === "and" || n.op === "or") {
      const l = ev(n.kids[0]);
      const short = n.op === "and" ? !l : !!l;
      if (short) {
        skipAll(n.kids[1]);
        order.push({ id: n.id, value: l, note: `${n.op}: left side is ${show(l)}, so the right side is never evaluated` });
        return l;
      }
      const r = ev(n.kids[1]);
      order.push({ id: n.id, value: r, note: `${n.op}: left is ${show(l)}, so the result is the right side, ${show(r)}` });
      return r;
    }
    const vals = n.kids.map(ev);
    const v = apply(n.op, vals[0], vals[1]);
    const sym = n.op === "neg" ? "−" : n.op;
    order.push({
      id: n.id,
      value: v,
      note: vals.length === 2 ? `${show(vals[0])} ${sym} ${show(vals[1])} = ${show(v)}` : `${sym} ${show(vals[0])} = ${show(v)}`,
    });
    return v;
  };
  const result = ev(root);
  return { order, skipped, result };
}

const show = (v: Val) => (typeof v === "boolean" ? (v ? "True" : "False") : Number.isInteger(v) ? String(v) : v.toFixed(3));

type Placed = { n: Node; x: number; y: number; px?: number; py?: number };

function layout(root: Node) {
  const out: Placed[] = [];
  let col = 0;
  let depth = 0;
  const walk = (n: Node, d: number, parent?: Placed) => {
    depth = Math.max(depth, d);
    const p: Placed = { n, x: 0, y: d, px: parent?.x, py: parent?.y };
    if (n.kids.length === 2) {
      walk(n.kids[0], d + 1, p);
      p.x = col++;
      out.push(p);
      walk(n.kids[1], d + 1, p);
    } else if (n.kids.length === 1) {
      p.x = col++;
      out.push(p);
      walk(n.kids[0], d + 1, p);
    } else {
      p.x = col++;
      out.push(p);
    }
  };
  walk(root, 0);
  // Children were placed before parents' x was known; relink parent coordinates.
  const byId = new Map(out.map((p) => [p.n.id, p]));
  for (const p of out) for (const k of p.n.kids) {
    const c = byId.get(k.id)!;
    c.px = p.x;
    c.py = p.y;
  }
  return { out, cols: col, depth };
}

const PRESETS = [
  "17 // 5 - 2 >= 17 % 5",
  "-7 % 3 == 2 ** 2 - 2",
  "(3 * 4 <= 20 // 3) and not (4 - 3 < 2 ** 2)",
  "(9 // 2 <= 3 ** 2) or (6 - 6 < 9 // 2)",
  "2 ** 3 ** 2 > 500",
];

/** Type a Python expression and step through its evaluation in precedence order. */
function ExprTree() {
  const [src, setSrc] = useState(PRESETS[2]);
  const [step, setStep] = useState(0);
  const tree = useMemo(() => parse(src), [src]);
  const run = useMemo(() => (tree ? plan(tree) : null), [tree]);
  const placed = useMemo(() => (tree ? layout(tree) : null), [tree]);

  const done = new Map(run?.order.slice(0, step).map((o) => [o.id, o.value]) ?? []);
  const current = run && step > 0 ? run.order[step - 1] : null;
  const finished = run && step >= run.order.length;
  const W = 520;
  const X = (c: number) => ((c + 0.5) / (placed?.cols || 1)) * W;
  const Y = (d: number) => 30 + d * 58;

  const choose = (s: string) => { setSrc(s); setStep(0); };

  return (
    <div className="viz viz-expr">
      <div className="viz-row viz-chips">
        {PRESETS.map((p, i) => (
          <button key={p} className={`chip chip-sm mono ${p === src ? "is-on" : ""}`} onClick={() => choose(p)}>Ex {i + 1}</button>
        ))}
      </div>
      <input
        className="expr-input mono"
        value={src}
        onChange={(e) => choose(e.target.value)}
        aria-label="Python expression"
        spellCheck={false}
      />

      {run && (
        <div className="sq-actions">
          <button className="btn" onClick={() => setStep((s) => Math.min(s + 1, run.order.length))} disabled={!!finished}>Evaluate next</button>
          <button className="btn btn-soft" onClick={() => setStep(run.order.length)} disabled={!!finished}>Finish</button>
          <button className="btn btn-ghost" onClick={() => setStep(0)}>Reset</button>
          <span className="mips-count">step {step} / {run.order.length}</span>
        </div>
      )}

      <Stage>
      {!tree || !placed || !run ? (
        <p className="viz-readout">Can't read that expression. Use numbers, + − * / // % **, comparisons, and, or, not, and parentheses.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${Y(placed.depth) + 30}`} className="tree-svg" role="img" aria-label="Expression tree">
            {placed.out.filter((p) => p.px !== undefined).map((p) => (
              <line key={`e${p.n.id}`} className={`t-edge ${step >= (run.skipped.get(p.n.id) ?? Infinity) ? "is-skipped" : ""}`} x1={X(p.px!)} y1={Y(p.py!)} x2={X(p.x)} y2={Y(p.y)} />
            ))}
            {placed.out.map((p) => {
              const leaf = !p.n.kids.length;
              const has = done.has(p.n.id);
              const skipped = step >= (run.skipped.get(p.n.id) ?? Infinity);
              const label = leaf ? String(p.n.value) : p.n.op === "neg" ? "−" : p.n.op;
              return (
                <g key={p.n.id} className={`t-node expr-node ${has ? "is-done" : ""} ${current?.id === p.n.id ? "is-current" : ""} ${skipped ? "is-skipped" : ""} ${leaf ? "is-leaf" : ""}`} transform={`translate(${X(p.x)} ${Y(p.y)})`}>
                  <rect x={-24} y={-15} width={48} height={30} rx={10} />
                  <text dy="5">{has && !leaf ? show(done.get(p.n.id)!) : label}</text>
                  {has && !leaf && <text className="expr-op" dy="-20">{p.n.op === "neg" ? "−" : p.n.op}</text>}
                </g>
              );
            })}
          </svg>

          <p className="viz-readout" aria-live="polite">
            {finished
              ? `Result: ${show(run.result)}${typeof run.result === "boolean" ? ` → enter ${run.result ? 1 : 0}` : ""}${run.skipped.size ? " · greyed nodes were short-circuited" : ""}`
              : current?.note ?? "Press Evaluate next: the deepest, tightest-binding operators go first."}
          </p>
        </>
      )}
      </Stage>
    </div>
  );
}

export default split(ExprTree);
