import { useState } from "react";

type Node = { k: number; l: Node | null; r: Node | null };

const insert = (t: Node | null, k: number): Node =>
  !t ? { k, l: null, r: null } : k < t.k ? { ...t, l: insert(t.l, k) } : k > t.k ? { ...t, r: insert(t.r, k) } : t;

const minOf = (t: Node): Node => (t.l ? minOf(t.l) : t);

/** Delete with the inorder successor when the node has two children. */
const remove = (t: Node | null, k: number): Node | null => {
  if (!t) return null;
  if (k < t.k) return { ...t, l: remove(t.l, k) };
  if (k > t.k) return { ...t, r: remove(t.r, k) };
  if (!t.l) return t.r;
  if (!t.r) return t.l;
  const s = minOf(t.r);
  return { k: s.k, l: t.l, r: remove(t.r, s.k) };
};

const pathTo = (t: Node | null, k: number, acc: number[] = []): number[] =>
  !t ? acc : t.k === k ? [...acc, t.k] : pathTo(k < t.k ? t.l : t.r, k, [...acc, t.k]);

const height = (t: Node | null): number => (t ? 1 + Math.max(height(t.l), height(t.r)) : 0);

type P = { k: number; x: number; y: number; px?: number; py?: number };

/** Inorder x positions keep the drawing sorted left to right. */
function place(t: Node | null): P[] {
  const out: P[] = [];
  let col = 0;
  const walk = (n: Node | null, d: number) => {
    if (!n) return;
    walk(n.l, d + 1);
    out.push({ k: n.k, x: col++, y: d });
    walk(n.r, d + 1);
  };
  walk(t, 0);
  // Second pass links each node to its parent's coordinates.
  const byKey = new Map(out.map((p) => [p.k, p]));
  const link = (n: Node | null) => {
    if (!n) return;
    for (const c of [n.l, n.r]) if (c) {
      const pc = byKey.get(c.k)!;
      const pp = byKey.get(n.k)!;
      pc.px = pp.x;
      pc.py = pp.y;
      link(c);
    }
  };
  link(t);
  return out;
}

const START = [50, 30, 70, 20, 40, 60, 80, 35].reduce<Node | null>((t, k) => insert(t, k), null);

/** Insert, search and delete keys and watch the comparison path. */
export default function BSTViz() {
  const [tree, setTree] = useState<Node | null>(START);
  const [input, setInput] = useState("45");
  const [path, setPath] = useState<number[]>([]);
  const [note, setNote] = useState("Smaller keys go left, larger keys go right.");

  const pts = place(tree);
  const cols = Math.max(pts.length, 1);
  const X = (c: number) => ((c + 0.5) / cols) * 400;
  const Y = (d: number) => 24 + d * 44;
  const k = Number(input);

  const act = (kind: "insert" | "search" | "delete") => {
    if (!input) return;
    const p = pathTo(tree, k);
    const found = p[p.length - 1] === k;
    setPath(p);
    if (kind === "insert") {
      setTree(insert(tree, k));
      setNote(found ? `${k} is already in the tree.` : `Compared with ${p.join(" → ") || "nothing"}, then attached ${k}.`);
    } else if (kind === "search") {
      setNote(found ? `Found ${k} after ${p.length} comparisons.` : `${k} not found; fell off after ${p.join(" → ")}.`);
    } else {
      setTree(remove(tree, k));
      setNote(found ? `Deleted ${k}. Two children? It was replaced by its inorder successor.` : `${k} not found.`);
      setPath([]);
    }
  };

  return (
    <div className="viz viz-bst">
      <svg viewBox={`0 0 400 ${Math.max(Y(height(tree)) - 10, 120)}`} className="tree-svg" role="img" aria-label="Binary search tree">
        {pts.filter((p) => p.px !== undefined).map((p) => (
          <line key={`e${p.k}`} className="t-edge" x1={X(p.px!)} y1={Y(p.py!)} x2={X(p.x)} y2={Y(p.y)} />
        ))}
        {pts.map((p) => (
          <g key={p.k} className={`t-node ${path.includes(p.k) ? "is-done" : ""} ${path[path.length - 1] === p.k ? "is-current" : ""}`} style={{ transform: `translate(${X(p.x)}px, ${Y(p.y)}px)` }}>
            <circle r="15" />
            <text dy="5">{p.k}</text>
          </g>
        ))}
      </svg>

      <div className="sq-actions">
        <input className="num-input" value={input} inputMode="numeric" aria-label="Key" onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} />
        <button className="btn" onClick={() => act("insert")} disabled={pts.length >= 15}>insert</button>
        <button className="btn btn-soft" onClick={() => act("search")}>search</button>
        <button className="btn btn-soft" onClick={() => act("delete")}>delete</button>
        <button className="btn btn-ghost" onClick={() => { setTree(START); setPath([]); }}>Reset</button>
      </div>
      <p className="viz-readout" aria-live="polite">{note} Height = {height(tree)}.</p>
    </div>
  );
}
