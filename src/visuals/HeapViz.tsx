import { useEffect, useState } from "react";
import { layoutBinary, parent } from "./treeLayout";

/** Snapshots of the array after each swap, so the heap fix-up can be animated. */
type Frame = { arr: number[]; hot: number[]; note: string };

function insertFrames(arr: number[], v: number): Frame[] {
  const a = [...arr, v];
  let i = a.length - 1;
  const frames: Frame[] = [{ arr: [...a], hot: [i], note: `Add ${v} at the next open slot` }];
  while (i > 0 && a[parent(i)] > a[i]) {
    const p = parent(i);
    [a[p], a[i]] = [a[i], a[p]];
    frames.push({ arr: [...a], hot: [p, i], note: `Up-heap: ${a[p]} < ${a[i]}, swap with parent` });
    i = p;
  }
  frames.push({ arr: [...a], hot: [i], note: "Heap order restored" });
  return frames;
}

function removeMinFrames(arr: number[]): Frame[] {
  if (!arr.length) return [];
  const min = arr[0];
  const a = [...arr];
  const last = a.pop()!;
  if (!a.length) return [{ arr: [], hot: [], note: `Removed ${min}` }];
  a[0] = last;
  const frames: Frame[] = [{ arr: [...a], hot: [0], note: `Remove ${min}; move last (${last}) to root` }];
  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = l + 1;
    let s = i;
    if (l < a.length && a[l] < a[s]) s = l;
    if (r < a.length && a[r] < a[s]) s = r;
    if (s === i) break;
    [a[s], a[i]] = [a[i], a[s]];
    frames.push({ arr: [...a], hot: [i, s], note: `Down-heap: swap with smaller child ${a[i]}` });
    i = s;
  }
  frames.push({ arr: [...a], hot: [i], note: "Heap order restored" });
  return frames;
}

/** A min-heap shown as a tree and as the array that stores it. */
export default function HeapViz() {
  const [frames, setFrames] = useState<Frame[]>([{ arr: [3, 8, 5, 12, 9, 7, 6], hot: [], note: "A min-heap" }]);
  const [k, setK] = useState(0);
  const [input, setInput] = useState("4");
  const frame = frames[Math.min(k, frames.length - 1)];
  const busy = k < frames.length - 1;

  useEffect(() => {
    if (!busy) return;
    const id = window.setTimeout(() => setK((x) => x + 1), 650);
    return () => window.clearTimeout(id);
  }, [k, busy]);

  const run = (fs: Frame[]) => {
    if (!fs.length) return;
    setFrames(fs);
    setK(0);
  };

  const placed = layoutBinary(frame.arr.map((_, i) => i), 400, 50, 24);

  return (
    <div className="viz viz-heap">
      <svg viewBox="0 0 400 190" className="tree-svg" role="img" aria-label="Heap as a tree">
        {placed.slice(1).map((p) => (
          <line key={`e${p.i}`} className="t-edge" x1={placed[parent(p.i)].x} y1={placed[parent(p.i)].y} x2={p.x} y2={p.y} />
        ))}
        {placed.map((p) => (
          <g key={p.i} className={`t-node ${frame.hot.includes(p.i) ? "is-current" : ""}`} transform={`translate(${p.x} ${p.y})`}>
            <circle r="15" />
            <text dy="5">{frame.arr[p.i]}</text>
          </g>
        ))}
      </svg>

      <div className="heap-array">
        {frame.arr.map((v, i) => (
          <div key={i} className={`heap-slot ${frame.hot.includes(i) ? "is-hot" : ""}`}>
            <strong>{v}</strong>
            <small>{i}</small>
          </div>
        ))}
      </div>

      <div className="sq-actions">
        <input
          className="num-input"
          value={input}
          inputMode="numeric"
          aria-label="Value to insert"
          onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
        />
        <button className="btn" disabled={busy || !input || frame.arr.length >= 15} onClick={() => run(insertFrames(frame.arr, +input))}>insert</button>
        <button className="btn btn-soft" disabled={busy || !frame.arr.length} onClick={() => run(removeMinFrames(frame.arr))}>removeMin</button>
      </div>
      <p className="viz-readout" aria-live="polite">{frame.note} · children of i are 2i+1 and 2i+2</p>
    </div>
  );
}
