import { useEffect, useMemo, useState } from "react";

type Frame = { a: number[]; cmp: number[]; done: number[]; note: string };
type Algo = "insertion" | "selection" | "bubble" | "merge";

function framesFor(algo: Algo, input: number[]): Frame[] {
  const a = [...input];
  const f: Frame[] = [{ a: [...a], cmp: [], done: [], note: "Start" }];
  const push = (cmp: number[], done: number[], note: string) => f.push({ a: [...a], cmp, done, note });

  if (algo === "insertion") {
    for (let i = 1; i < a.length; i++) {
      let j = i;
      while (j > 0 && a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        push([j - 1, j], [], `Shift ${a[j - 1]} left past ${a[j]}`);
        j--;
      }
      push([j], [], `${a[j]} is in place among the first ${i + 1}`);
    }
  } else if (algo === "selection") {
    for (let i = 0; i < a.length; i++) {
      let m = i;
      for (let j = i + 1; j < a.length; j++) {
        push([m, j], range(i), `Smallest so far: ${a[m]}`);
        if (a[j] < a[m]) m = j;
      }
      [a[i], a[m]] = [a[m], a[i]];
      push([i], range(i + 1), `Place ${a[i]} at index ${i}`);
    }
  } else if (algo === "bubble") {
    for (let end = a.length - 1; end > 0; end--) {
      for (let j = 0; j < end; j++) {
        const swap = a[j] > a[j + 1];
        if (swap) [a[j], a[j + 1]] = [a[j + 1], a[j]];
        push([j, j + 1], range(a.length).slice(end + 1), swap ? "Swap neighbours" : "In order");
      }
    }
  } else {
    const sort = (lo: number, hi: number) => {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1;
      sort(lo, mid);
      sort(mid, hi);
      const merged: number[] = [];
      let i = lo;
      let j = mid;
      while (i < mid || j < hi) merged.push(j >= hi || (i < mid && a[i] <= a[j]) ? a[i++] : a[j++]);
      merged.forEach((v, k) => (a[lo + k] = v));
      push(range(hi).slice(lo), [], `Merge [${lo}..${mid - 1}] with [${mid}..${hi - 1}]`);
    };
    sort(0, a.length);
  }
  f.push({ a: [...a], cmp: [], done: range(a.length), note: `Sorted in ${f.length - 1} steps` });
  return f;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const shuffled = () => range(12).map(() => 2 + Math.floor(Math.random() * 18));

const INFO: Record<Algo, string> = {
  insertion: "O(n²) worst, O(n) on nearly sorted input; stable, in place.",
  selection: "Always O(n²) comparisons but at most n swaps; in place.",
  bubble: "O(n²); each pass bubbles the largest remaining value to the end.",
  merge: "O(n log n) always; stable but needs O(n) extra space.",
};

/** Pick an algorithm and step or play through every comparison. */
export default function SortViz() {
  const [algo, setAlgo] = useState<Algo>("insertion");
  const [data, setData] = useState(shuffled);
  const frames = useMemo(() => framesFor(algo, data), [algo, data]);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fr = frames[Math.min(k, frames.length - 1)];

  useEffect(() => setK(0), [frames]);
  useEffect(() => {
    if (!playing) return;
    if (k >= frames.length - 1) return setPlaying(false);
    const id = window.setTimeout(() => setK((x) => x + 1), 140);
    return () => window.clearTimeout(id);
  }, [playing, k, frames.length]);

  return (
    <div className="viz viz-sort">
      <div className="viz-row viz-chips">
        {(Object.keys(INFO) as Algo[]).map((x) => (
          <button key={x} className={`chip ${x === algo ? "is-on" : ""}`} aria-pressed={x === algo} onClick={() => { setAlgo(x); setPlaying(false); }}>
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>

      <div className="sort-bars" role="img" aria-label="Array being sorted">
        {fr.a.map((v, i) => (
          <div key={i} className={`sort-bar ${fr.cmp.includes(i) ? "is-cmp" : ""} ${fr.done.includes(i) ? "is-done" : ""}`} style={{ height: `${(v / 20) * 100}%` }}>
            <span>{v}</span>
          </div>
        ))}
      </div>

      <input className="sort-scrub" type="range" min={0} max={frames.length - 1} value={k} aria-label="Step" onChange={(e) => { setPlaying(false); setK(+e.target.value); }} />

      <div className="sq-actions">
        <button className="btn" onClick={() => { if (k >= frames.length - 1) setK(0); setPlaying(!playing); }}>
          {playing ? "Pause" : k >= frames.length - 1 ? "Replay" : "Play"}
        </button>
        <button className="btn btn-soft" onClick={() => { setPlaying(false); setK((x) => Math.min(x + 1, frames.length - 1)); }}>Step</button>
        <button className="btn btn-ghost" onClick={() => { setPlaying(false); setData(shuffled()); }}>Shuffle</button>
        <span className="mips-count">step {k} / {frames.length - 1}</span>
      </div>
      <p className="viz-readout" aria-live="polite">{fr.note}. {INFO[algo]}</p>
    </div>
  );
}
