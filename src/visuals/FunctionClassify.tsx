import { useMemo, useState } from "react";
import FunctionMap from "./FunctionMap";
import { split, Stage } from "./Stage";

type Dom = "N" | "Z" | "R";
type Fn = { label: string; f: (x: number) => number; defined?: (x: number) => boolean };

const FNS: Fn[] = [
  { label: "f(x) = 2x + 1", f: (x) => 2 * x + 1 },
  { label: "f(x) = x + 3", f: (x) => x + 3 },
  { label: "f(x) = x²", f: (x) => x * x },
  { label: "f(x) = x³", f: (x) => x ** 3 },
  { label: "f(x) = ⌊x / 2⌋", f: (x) => Math.floor(x / 2) },
  { label: "f(x) = √x", f: (x) => Math.sqrt(x), defined: (x) => x >= 0 },
];

const DOMS: Record<Dom, { label: string; xs: number[]; continuous: boolean; member: (y: number) => boolean }> = {
  N: { label: "ℕ → ℕ", xs: Array.from({ length: 9 }, (_, i) => i), continuous: false, member: (y) => Number.isInteger(y) && y >= 0 },
  Z: { label: "ℤ → ℤ", xs: Array.from({ length: 13 }, (_, i) => i - 6), continuous: false, member: (y) => Number.isInteger(y) },
  R: { label: "ℝ → ℝ", xs: Array.from({ length: 241 }, (_, i) => -6 + i * 0.05), continuous: true, member: () => true },
};

const W = 440;
const H = 300;
const VIEW = 8;
const sx = (x: number) => W / 2 + (x / VIEW) * (W / 2);
const sy = (y: number) => H / 2 - (y / VIEW) * (H / 2);

/**
 * Classify a rule on ℕ, ℤ or ℝ. Drag the horizontal line: two crossings
 * break injectivity, and a level with no crossing (inside the codomain)
 * breaks surjectivity.
 */
function GraphTests() {
  const [fn, setFn] = useState(FNS[0]);
  const [dom, setDom] = useState<Dom>("Z");
  const [level, setLevel] = useState(2);
  const d = DOMS[dom];

  const pts = useMemo(() => d.xs.filter((x) => !fn.defined || fn.defined(x)).map((x) => [x, fn.f(x)] as const), [d, fn]);
  const total = d.xs.every((x) => (!fn.defined || fn.defined(x)) && d.member(fn.f(x)));
  // Classification from the rule's algebra over the whole domain, not just the plotted window.
  const verdict = useMemo(() => classify(fn.label, dom), [fn, dom]);
  const hits = pts.filter(([, y]) => Math.abs(y - level) < (d.continuous ? 0.06 : 1e-9));

  return (
    <>
      <div className="viz-row viz-chips">
        {FNS.map((f) => <button key={f.label} className={`chip chip-sm mono ${f === fn ? "is-on" : ""}`} onClick={() => setFn(f)}>{f.label}</button>)}
      </div>
      <div className="viz-row viz-chips">
        {(Object.keys(DOMS) as Dom[]).map((k) => (
          <button key={k} className={`chip ${k === dom ? "is-on" : ""}`} onClick={() => setDom(k)}>{DOMS[k].label}</button>
        ))}
      </div>
      <label className="growth-n">
        horizontal line y = <strong>{level}</strong>
        <input type="range" min={-6} max={6} step={1} value={level} onChange={(e) => setLevel(+e.target.value)} />
      </label>
      <Stage>
      <svg viewBox={`0 0 ${W} ${H}`} className="fgraph" role="img" aria-label={`${fn.label} on ${d.label}`}>
        <line x1="0" y1={sy(0)} x2={W} y2={sy(0)} className="axis" />
        <line x1={sx(0)} y1="0" x2={sx(0)} y2={H} className="axis" />
        {d.continuous ? (
          <path className="fgraph-line" d={pts.map(([x, y], i) => `${i ? "L" : "M"} ${sx(x)} ${sy(Math.max(-20, Math.min(20, y)))}`).join(" ")} />
        ) : (
          pts.map(([x, y]) => <circle key={x} cx={sx(x)} cy={sy(y)} r="5" className="fgraph-dot" />)
        )}
        <line x1="0" y1={sy(level)} x2={W} y2={sy(level)} className="hline" />
        {hits.map(([x, y]) => <circle key={`h${x}`} cx={sx(x)} cy={sy(y)} r="8" className="hline-hit" />)}
      </svg>
      <div className="func-badges">
        <span className={`badge ${total ? "is-yes" : "is-no"}`}>Function</span>
        <span className={`badge ${verdict.inj ? "is-yes" : "is-no"}`}>Injective</span>
        <span className={`badge ${verdict.sur ? "is-yes" : "is-no"}`}>Surjective</span>
      </div>
      <p className="viz-readout" aria-live="polite">
        {hits.length > 1 ? `y = ${level} is hit ${hits.length} times here, so not injective. ` : hits.length === 0 ? `Nothing maps to y = ${level} in this window. ` : `y = ${level} is hit once. `}
        {!total ? "Some input has no output in the codomain, so it isn't a function on this domain." : verdict.why}
      </p>
      </Stage>
    </>
  );
}

/** Known answers for the preset rules on each domain. */
function classify(label: string, dom: Dom): { inj: boolean; sur: boolean; why: string } {
  const table: Record<string, Record<Dom, [boolean, boolean, string]>> = {
    "f(x) = 2x + 1": { N: [true, false, "Only odd outputs are reached."], Z: [true, false, "Only odd integers are reached."], R: [true, true, "A non-flat line hits every real exactly once: bijective."] },
    "f(x) = x + 3": { N: [true, false, "0, 1 and 2 are never reached."], Z: [true, true, "Shifting ℤ by 3 covers ℤ exactly once: bijective."], R: [true, true, "Bijective: the inverse is y − 3."] },
    "f(x) = x²": { N: [true, false, "Only perfect squares are reached."], Z: [false, false, "x and −x collide, and non-squares are missed."], R: [false, false, "x and −x collide, and negatives are missed."] },
    "f(x) = x³": { N: [true, false, "Only cubes are reached."], Z: [true, false, "Only cubes are reached."], R: [true, true, "Strictly increasing and unbounded both ways: bijective."] },
    "f(x) = ⌊x / 2⌋": { N: [false, true, "0 and 1 both map to 0, but every natural is reached."], Z: [false, true, "Pairs collide (2k and 2k+1), but every integer is reached."], R: [false, false, "Whole intervals collapse to one output, and only integers are ever reached."] },
    "f(x) = √x": { N: [true, false, "Not every natural has a natural square root."], Z: [true, false, "Undefined for negatives."], R: [true, false, "Undefined for negative inputs."] },
  };
  const [inj, sur, why] = table[label][dom];
  return { inj, sur, why };
}

/** Function classification: an arrow diagram, and a graph with line tests. */
function FunctionClassify() {
  const [tab, setTab] = useState<"map" | "graph">("map");
  return (
    <div className="viz">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "map"} className={tab === "map" ? "is-on" : ""} onClick={() => setTab("map")}>Arrow diagram</button>
        <button role="tab" aria-selected={tab === "graph"} className={tab === "graph" ? "is-on" : ""} onClick={() => setTab("graph")}>Graph & line test</button>
      </div>
      {tab === "map" ? <FunctionMap /> : <div className="viz"><GraphTests /></div>}
    </div>
  );
}

export default split(FunctionClassify);
