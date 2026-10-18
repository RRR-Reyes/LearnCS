import { useEffect, useState } from "react";
import { layoutBinary, parent } from "./treeLayout";

/** Node labels by heap index; missing indices are empty positions. */
const TREE: Record<number, string> = { 0: "F", 1: "B", 2: "G", 3: "A", 4: "D", 6: "I", 9: "C", 10: "E", 13: "H" };
const IDX = Object.keys(TREE).map(Number);

type Order = "pre" | "in" | "post" | "level";

function visit(order: Order): number[] {
  if (order === "level") return [...IDX].sort((a, b) => a - b);
  const out: number[] = [];
  const walk = (i: number) => {
    if (!(i in TREE)) return;
    if (order === "pre") out.push(i);
    walk(2 * i + 1);
    if (order === "in") out.push(i);
    walk(2 * i + 2);
    if (order === "post") out.push(i);
  };
  walk(0);
  return out;
}

const ORDERS: { key: Order; label: string; rule: string }[] = [
  { key: "pre", label: "Preorder", rule: "node, left, right" },
  { key: "in", label: "Inorder", rule: "left, node, right" },
  { key: "post", label: "Postorder", rule: "left, right, node" },
  { key: "level", label: "Level order", rule: "top to bottom, left to right (queue)" },
];

/** Pick a traversal and play it; nodes light up in the order they are visited. */
export default function TreeTraversal() {
  const [order, setOrder] = useState<Order>("in");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const seq = visit(order);
  const placed = layoutBinary(IDX, 400, 50, 24);
  const at = (i: number) => placed.find((p) => p.i === i)!;

  useEffect(() => {
    if (!playing) return;
    if (step >= seq.length) return setPlaying(false);
    const id = window.setTimeout(() => setStep((s) => s + 1), 520);
    return () => window.clearTimeout(id);
  }, [playing, step, seq.length]);

  const choose = (o: Order) => {
    setOrder(o);
    setStep(0);
    setPlaying(true);
  };

  return (
    <div className="viz viz-tree">
      <div className="viz-row viz-chips">
        {ORDERS.map((o) => (
          <button key={o.key} className={`chip ${o.key === order ? "is-on" : ""}`} aria-pressed={o.key === order} onClick={() => choose(o.key)}>
            {o.label}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 400 200" className="tree-svg" role="img" aria-label="Binary tree">
        {IDX.filter((i) => i > 0).map((i) => (
          <line key={`e${i}`} className="t-edge" x1={at(parent(i)).x} y1={at(parent(i)).y} x2={at(i).x} y2={at(i).y} />
        ))}
        {placed.map((p) => {
          const n = seq.indexOf(p.i);
          const done = n > -1 && n < step;
          const current = n === step - 1;
          return (
            <g key={p.i} className={`t-node ${done ? "is-done" : ""} ${current ? "is-current" : ""}`} transform={`translate(${p.x} ${p.y})`}>
              <circle r="15" />
              <text dy="5">{TREE[p.i]}</text>
              {done && <text className="t-order" dx="14" dy="-12">{n + 1}</text>}
            </g>
          );
        })}
      </svg>

      <div className="trav-seq" aria-live="polite">
        {seq.map((i, k) => (
          <span key={`${order}-${i}`} className={k < step ? "is-on" : ""}>{TREE[i]}</span>
        ))}
      </div>

      <div className="sq-actions">
        <button className="btn" onClick={() => { if (step >= seq.length) setStep(0); setPlaying(!playing); }}>
          {playing ? "Pause" : step >= seq.length ? "Replay" : "Play"}
        </button>
        <button className="btn btn-soft" onClick={() => { setPlaying(false); setStep((s) => Math.min(s + 1, seq.length)); }}>Step</button>
      </div>
      <p className="viz-readout">{ORDERS.find((o) => o.key === order)!.rule}</p>
    </div>
  );
}
