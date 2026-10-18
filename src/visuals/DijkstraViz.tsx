import { useMemo, useState } from "react";

const NODES = [
  { id: "A", x: 50, y: 110 },
  { id: "B", x: 150, y: 40 },
  { id: "C", x: 150, y: 180 },
  { id: "D", x: 260, y: 40 },
  { id: "E", x: 260, y: 180 },
  { id: "F", x: 355, y: 110 },
];
const EDGES: [number, number, number][] = [
  [0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 5], [2, 4, 8], [2, 3, 9], [3, 4, 2], [3, 5, 6], [4, 5, 3],
];

type Snap = { dist: number[]; prev: (number | null)[]; done: boolean[]; current: number | null; relaxed: number[]; note: string };

/** Precompute every step of Dijkstra so the user can scrub back and forth. */
function run(src: number): Snap[] {
  const n = NODES.length;
  const dist = Array(n).fill(Infinity);
  const prev: (number | null)[] = Array(n).fill(null);
  const done = Array(n).fill(false);
  dist[src] = 0;
  const snaps: Snap[] = [{ dist: [...dist], prev: [...prev], done: [...done], current: null, relaxed: [], note: `Start: d(${NODES[src].id}) = 0, others ∞` }];
  for (let it = 0; it < n; it++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
    if (u === -1 || dist[u] === Infinity) break;
    done[u] = true;
    const relaxed: number[] = [];
    for (const [a, b, w] of EDGES) {
      const v = a === u ? b : b === u ? a : -1;
      if (v < 0 || done[v]) continue;
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        relaxed.push(v);
      }
    }
    snaps.push({
      dist: [...dist], prev: [...prev], done: [...done], current: u, relaxed,
      note: `Remove ${NODES[u].id} (d = ${dist[u]}) from the queue${relaxed.length ? `; relax ${relaxed.map((v) => NODES[v].id).join(", ")}` : ""}`,
    });
  }
  return snaps;
}

/** Choose a source and step through how shortest distances get settled. */
export default function DijkstraViz() {
  const [src, setSrc] = useState(0);
  const snaps = useMemo(() => run(src), [src]);
  const [k, setK] = useState(0);
  const s = snaps[Math.min(k, snaps.length - 1)];
  const treeEdge = (a: number, b: number) => s.prev[b] === a || s.prev[a] === b;

  return (
    <div className="viz viz-dijkstra">
      <div className="viz-row viz-chips">
        <span className="chip-label">Source</span>
        {NODES.map((nd, i) => (
          <button key={nd.id} className={`chip ${i === src ? "is-on" : ""}`} aria-pressed={i === src} onClick={() => { setSrc(i); setK(0); }}>
            {nd.id}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 400 220" className="graph-svg" role="img" aria-label="Weighted graph">
        {EDGES.map(([a, b, w]) => (
          <g key={`${a}-${b}`}>
            <line className={`g-edge ${treeEdge(a, b) ? "is-tree" : ""}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
            <text className="g-weight" x={(NODES[a].x + NODES[b].x) / 2} y={(NODES[a].y + NODES[b].y) / 2 - 6}>{w}</text>
          </g>
        ))}
        {NODES.map((nd, i) => (
          <g key={nd.id} className={`g-node ${s.done[i] ? "is-done" : ""} ${s.current === i ? "is-picked" : ""} ${s.relaxed.includes(i) ? "is-relaxed" : ""}`} transform={`translate(${nd.x} ${nd.y})`}>
            <circle r="17" />
            <text dy="5">{nd.id}</text>
            <text className="g-deg" dy="34">{s.dist[i] === Infinity ? "∞" : s.dist[i]}</text>
          </g>
        ))}
      </svg>

      <div className="sq-actions">
        <button className="btn btn-soft" disabled={k === 0} onClick={() => setK(k - 1)}>Back</button>
        <button className="btn" disabled={k >= snaps.length - 1} onClick={() => setK(k + 1)}>Step</button>
        <button className="btn btn-ghost" onClick={() => setK(0)}>Reset</button>
        <span className="mips-count">step {k} / {snaps.length - 1}</span>
      </div>
      <p className="viz-readout" aria-live="polite">{s.note}</p>
    </div>
  );
}
