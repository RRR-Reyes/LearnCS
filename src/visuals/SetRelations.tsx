import { useState } from "react";
import type { CSSProperties } from "react";
import { split, Stage } from "./Stage";

type Rel = { key: string; label: string; a: [number, number]; b: [number, number]; sub: boolean; proper: boolean; disjoint: boolean; empty: boolean; note: string };

/** Circle offset and radius for A and B in each arrangement. */
const RELS: Rel[] = [
  { key: "overlap", label: "Overlapping", a: [-60, 92], b: [60, 92], sub: false, proper: false, disjoint: false, empty: false, note: "They share some elements, so none of the special relationships hold." },
  { key: "subset", label: "A ⊂ B", a: [-18, 52], b: [0, 118], sub: true, proper: true, disjoint: false, empty: false, note: "Every element of A is in B and B has more, so A ⊂ B (and A ⊆ B)." },
  { key: "equal", label: "A = B", a: [0, 100], b: [0, 100], sub: true, proper: false, disjoint: false, empty: false, note: "A ⊆ B still holds, but not A ⊂ B: a proper subset must be missing something." },
  { key: "disjoint", label: "Disjoint", a: [-120, 78], b: [120, 78], sub: false, proper: false, disjoint: true, empty: false, note: "A ∩ B = ∅: nothing is shared." },
  { key: "empty", label: "A = ∅", a: [-60, 0], b: [60, 92], sub: true, proper: true, disjoint: true, empty: true, note: "∅ is a subset of every set, a proper subset of any nonempty set, and disjoint from all of them." },
];

/** Pick an arrangement of A and B; the circles glide into place and the relation badges update. */
function SetRelations() {
  const [rel, setRel] = useState(RELS[0]);
  const badges: [string, string, boolean][] = [
    ["A ⊆ B", "subset", rel.sub],
    ["A ⊂ B", "proper subset", rel.proper],
    ["A ∩ B = ∅", "disjoint", rel.disjoint],
    ["A = ∅", "empty", rel.empty],
  ];

  return (
    <div className="viz viz-rel">
      <div className="viz-row viz-chips">
        {RELS.map((r) => (
          <button key={r.key} className={`chip ${r === rel ? "is-on" : ""}`} aria-pressed={r === rel} onClick={() => setRel(r)}>{r.label}</button>
        ))}
      </div>
      <Stage>
      <svg viewBox="0 0 500 300" className="venn-svg" role="img" aria-label={`Sets A and B: ${rel.label}`}>
        <rect x="10" y="10" width="480" height="280" rx="18" className="venn-universe" />
        <circle className="rel-circle rel-b" cx="250" cy="150" style={{ transform: `translate(${rel.b[0]}px, 0px)`, r: rel.b[1] } as CSSProperties} />
        <circle className="rel-circle rel-a" cx="250" cy="150" style={{ transform: `translate(${rel.a[0]}px, 0px)`, r: rel.a[1] } as CSSProperties} />
        <text x="250" y="150" dy="5" className="rel-tag" style={{ transform: `translate(${rel.a[0]}px, 0px)`, opacity: rel.a[1] ? 1 : 0 }}>A</text>
        <text x="250" y="50" className="rel-tag" style={{ transform: `translate(${rel.b[0] + (rel.key === "subset" ? 70 : 0)}px, ${rel.key === "subset" ? 30 : 0}px)` }}>B</text>
      </svg>
      <div className="rel-badges">
        {badges.map(([sym, word, on]) => (
          <div key={word} className={`rel-badge ${on ? "is-yes" : "is-no"}`}>
            <span className="mono">{sym}</span>
            <small>{word}</small>
          </div>
        ))}
      </div>
      <p className="viz-readout" aria-live="polite">{rel.note}</p>
      </Stage>
    </div>
  );
}

export default split(SetRelations);
