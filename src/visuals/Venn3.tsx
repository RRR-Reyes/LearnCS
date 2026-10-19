import { useMemo, useState } from "react";
import { split, Stage } from "./Stage";

/**
 * Region codes: bit 4 = in A, 2 = in B, 1 = in C (0 = outside all three).
 * A selection is an 8-bit mask with bit k set when region k is chosen.
 */
const A_MASK = 0xf0;
const B_MASK = 0xcc;
const C_MASK = 0xaa;

const CIRCLES = { A: [190, 165], B: [310, 165], C: [250, 265] } as const;
const R = 110;

/** Sample elements living in each region, so selections have concrete members. */
const ELEMS: Record<number, number[]> = { 4: [1, 2], 2: [3], 1: [4, 5], 6: [6], 5: [7], 3: [8], 7: [9], 0: [10, 11] };
const SPOT: Record<number, [number, number]> = {
  4: [138, 140], 2: [362, 140], 1: [250, 322], 6: [250, 126], 5: [196, 238], 3: [304, 238], 7: [250, 196], 0: [440, 372],
};
const LABEL: Record<number, string> = {
  7: "A∩B∩C", 6: "A∩B only", 5: "A∩C only", 3: "B∩C only", 4: "A only", 2: "B only", 1: "C only", 0: "Outside all",
};
const ORDER = [7, 6, 5, 3, 4, 2, 1, 0];

/** Every expression up to three operations, grouped by the regions it covers. */
function buildNames() {
  const map = new Map<number, string[]>();
  const add = (s: string, m: number) => {
    const list = map.get(m) ?? [];
    if (!list.includes(s)) list.push(s);
    map.set(m, list);
  };
  const atoms: [string, number][] = [["A", A_MASK], ["B", B_MASK], ["C", C_MASK], ["Aᶜ", ~A_MASK & 255], ["Bᶜ", ~B_MASK & 255], ["Cᶜ", ~C_MASK & 255]];
  const ops: [string, (a: number, b: number) => number, boolean][] = [
    ["∪", (a, b) => a | b, true],
    ["∩", (a, b) => a & b, true],
    ["−", (a, b) => a & ~b & 255, false],
    ["⊕", (a, b) => a ^ b, true],
  ];
  add("U", 255);
  add("∅", 0);
  atoms.forEach(([s, m]) => add(s, m));
  const pairs: [string, number][] = [];
  atoms.forEach(([xs, xm], i) =>
    atoms.forEach(([ys, ym], j) => {
      if (i === j || xs[0] === ys[0]) return;
      ops.forEach(([o, f, comm]) => {
        if (comm && j < i) return;
        const s = `${xs} ${o} ${ys}`;
        add(s, f(xm, ym));
        pairs.push([s, f(xm, ym)]);
      });
    })
  );
  pairs.forEach(([xs, xm]) =>
    atoms.forEach(([ys, ym]) => {
      if (xs.includes(ys[0])) return;
      ops.forEach(([o, f, comm]) => {
        // Chains of one associative operator need no parentheses: A ∩ B ∩ C.
        const parts = xs.split(` ${o} `);
        if (comm && parts.length === 2 && !/[∪∩−⊕]/.test(parts.join(""))) {
          add([...parts, ys].sort().join(` ${o} `), f(xm, ym));
        }
        add(`${ys} ${o} (${xs})`, f(ym, xm));
        if (!comm) add(`(${xs}) ${o} ${ys}`, f(xm, ym));
      });
    })
  );
  const comps = (t: string) => (t.match(/ᶜ/g) ?? []).length;
  map.forEach((list) => list.sort((a, b) => a.length - b.length || comps(a) - comps(b)));
  return map;
}

const PRESETS: [string, number][] = [
  ["A ∩ B", 0xc0], ["A − (B ∪ C)", 0x10], ["(A ∩ B) ∪ C", 0xea], ["A ⊕ B", 0x3c], ["(A ∪ B ∪ C)ᶜ", 0x01],
];

const has = (c: number, bit: number) => (c & bit) !== 0;
const minterm = (c: number) => ["A", "B", "C"].map((L, k) => (has(c, 4 >> k) ? L : `${L}ᶜ`)).join(" ∩ ");
const builder = (c: number) => ["A", "B", "C"].map((L, k) => `x ${has(c, 4 >> k) ? "∈" : "∉"} ${L}`).join(" ∧ ");
const logic = (c: number) => ["A", "B", "C"].map((L, k) => (has(c, 4 >> k) ? L : `¬${L}`)).join(" ∧ ");
const join = (parts: string[], sep: string) => (parts.length > 1 ? parts.map((p) => `(${p})`) : parts).join(sep);

/** Click regions of a three-set Venn diagram to see every way to write the selection. */
function Venn3() {
  const names = useMemo(buildNames, []);
  const [sel, setSel] = useState<number[]>([7]);
  const isSel = (c: number) => sel.includes(c);
  const mask = sel.reduce((m, c) => m | (1 << c), 0);
  const chosen = ORDER.filter(isSel);
  const members = chosen.flatMap((c) => ELEMS[c]).sort((a, b) => a - b);
  const ways = (names.get(mask) ?? []).slice(0, 7);

  const toggle = (c: number) => setSel(isSel(c) ? sel.filter((x) => x !== c) : [...sel, c]);
  const fromMask = (m: number) => setSel(Array.from({ length: 8 }, (_, c) => c).filter((c) => m & (1 << c)));

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 500;
    const y = ((e.clientY - box.top) / box.height) * 410;
    if (x < 10 || x > 490 || y < 10 || y > 400) return;
    const inside = ([cx, cy]: readonly number[]) => Math.hypot(x - cx, y - cy) <= R;
    toggle((inside(CIRCLES.A) ? 4 : 0) | (inside(CIRCLES.B) ? 2 : 0) | (inside(CIRCLES.C) ? 1 : 0));
  };

  const fill = (c: number) => ({ fill: isSel(c) ? "hsl(var(--uh) 55% 55% / 0.5)" : "transparent" });

  return (
    <div className="viz viz-venn3">
      <div className="viz-row viz-chips">
        <span className="chip-label">Try</span>
        {PRESETS.map(([label, m]) => (
          <button key={label} className={`chip chip-sm mono ${mask === m ? "is-on" : ""}`} onClick={() => fromMask(m)}>{label}</button>
        ))}
        <button className="chip chip-sm venn-clear" onClick={() => setSel([])}>Clear</button>
      </div>
      <div className="viz-row viz-chips" role="group" aria-label="Regions">
        {ORDER.map((c) => (
          <button key={c} className={`chip chip-sm ${isSel(c) ? "is-on" : ""}`} aria-pressed={isSel(c)} onClick={() => toggle(c)}>{LABEL[c]}</button>
        ))}
      </div>

      <Stage>
      <svg viewBox="0 0 500 410" className="venn-svg" onClick={onClick} role="img" aria-label="Three-set Venn diagram; click regions to select them">
        <defs>
          {(Object.keys(CIRCLES) as (keyof typeof CIRCLES)[]).map((k) => (
            <clipPath key={k} id={`v3c${k}`}><circle cx={CIRCLES[k][0]} cy={CIRCLES[k][1]} r={R} /></clipPath>
          ))}
          {[["nA", ["A"]], ["nB", ["B"]], ["nC", ["C"]], ["nBC", ["B", "C"]], ["nAC", ["A", "C"]], ["nAB", ["A", "B"]], ["nABC", ["A", "B", "C"]]].map(([id, out]) => (
            <mask key={id as string} id={`v3${id}`}>
              <rect width="500" height="410" fill="white" />
              {(out as (keyof typeof CIRCLES)[]).map((k) => <circle key={k} cx={CIRCLES[k][0]} cy={CIRCLES[k][1]} r={R} fill="black" />)}
            </mask>
          ))}
        </defs>
        <rect x="10" y="10" width="480" height="390" rx="18" className="venn-universe" />
        <rect className="region" x="10" y="10" width="480" height="390" rx="18" mask="url(#v3nABC)" style={fill(0)} />
        <g clipPath="url(#v3cA)"><rect className="region" width="500" height="410" mask="url(#v3nBC)" style={fill(4)} /></g>
        <g clipPath="url(#v3cB)"><rect className="region" width="500" height="410" mask="url(#v3nAC)" style={fill(2)} /></g>
        <g clipPath="url(#v3cC)"><rect className="region" width="500" height="410" mask="url(#v3nAB)" style={fill(1)} /></g>
        <g clipPath="url(#v3cA)"><g clipPath="url(#v3cB)"><rect className="region" width="500" height="410" mask="url(#v3nC)" style={fill(6)} /></g></g>
        <g clipPath="url(#v3cA)"><g clipPath="url(#v3cC)"><rect className="region" width="500" height="410" mask="url(#v3nB)" style={fill(5)} /></g></g>
        <g clipPath="url(#v3cB)"><g clipPath="url(#v3cC)"><rect className="region" width="500" height="410" mask="url(#v3nA)" style={fill(3)} /></g></g>
        <g clipPath="url(#v3cA)"><g clipPath="url(#v3cB)"><g clipPath="url(#v3cC)"><rect className="region" width="500" height="410" style={fill(7)} /></g></g></g>
        {(Object.keys(CIRCLES) as (keyof typeof CIRCLES)[]).map((k) => (
          <circle key={k} cx={CIRCLES[k][0]} cy={CIRCLES[k][1]} r={R} className="venn-ring" />
        ))}
        <text x="74" y="66" className="venn-label">A</text>
        <text x="412" y="66" className="venn-label">B</text>
        <text x="376" y="372" className="venn-label">C</text>
        <text x="26" y="388" className="venn-u">U</text>
        {ORDER.flatMap((c) =>
          ELEMS[c].map((n, i) => {
            const x = SPOT[c][0] + (i - (ELEMS[c].length - 1) / 2) * 30;
            return (
              <g key={n} className={`venn-dot ${isSel(c) ? "is-hit" : ""}`} transform={`translate(${x} ${SPOT[c][1]})`} pointerEvents="none">
                <circle r="13" />
                <text dy="4">{n}</text>
              </g>
            );
          })
        )}
      </svg>

      <div className="venn-out" aria-live="polite">
        {chosen.length === 0 ? (
          <p>Click any region of the diagram, or a region chip, to see every way to write it.</p>
        ) : (
          <>
            <div className="venn-out-row">
              <span className="venn-out-k">Selection</span>
              <span className="mono"><strong>{members.length ? `{${members.join(", ")}}` : "∅"}</strong> · |·| = {members.length}</span>
            </div>
            <div>
              <span className="venn-out-k">Ways to write it</span>
              <div className="venn-ways">
                {(ways.length ? ways : ["No short name: use the region form"]).map((w) => <span key={w} className="mono pop">{w}</span>)}
              </div>
            </div>
            <dl className="venn-forms">
              <dt>Regions</dt><dd className="mono">{join(chosen.map(minterm), " ∪ ")}</dd>
              <dt>Set-builder</dt><dd className="mono">{`{ x ∈ U | ${join(chosen.map(builder), " ∨ ")} }`}</dd>
              <dt>Logic</dt><dd className="mono">{join(chosen.map(logic), " ∨ ")}</dd>
            </dl>
          </>
        )}
      </div>
      </Stage>
    </div>
  );
}

export default split(Venn3);
