import { useState } from "react";

type Edge = [number, number];

const W = 400;
const H = 230;
const START = {
  nodes: [
    { x: 80, y: 60 },
    { x: 200, y: 40 },
    { x: 320, y: 70 },
    { x: 130, y: 180 },
    { x: 280, y: 180 },
  ],
  edges: [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 4],
    [1, 4],
  ] as Edge[],
};

const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/**
 * Havel–Hakimi: repeatedly remove the largest degree d and subtract 1 from
 * the next d degrees. The sequence is graphical iff this ends in all zeros.
 */
function havelHakimi(seq: number[]) {
  const steps: string[] = [];
  let s = [...seq].sort((a, b) => b - a);
  if (s.reduce((t, v) => t + v, 0) % 2) return { ok: false, steps: ["The degree sum is odd, so no graph has this sequence."] };
  while (s.length && s[0] > 0) {
    const [d, ...rest] = s;
    if (d > rest.length) return { ok: false, steps: [...steps, `Need ${d} neighbours but only ${rest.length} vertices remain.`] };
    const next = rest.map((v, i) => (i < d ? v - 1 : v));
    if (next.some((v) => v < 0)) return { ok: false, steps: [...steps, "A degree went negative."] };
    steps.push(`remove ${d}, subtract 1 from the next ${d}: (${next.slice().sort((a, b) => b - a).join(", ")})`);
    s = next.sort((a, b) => b - a);
  }
  return { ok: true, steps: [...steps, "All zeros: graphical ✓"] };
}

/**
 * Click empty space to add a vertex; click two vertices to add or remove
 * the edge between them. Degree sequence and adjacency matrix follow along.
 */
export default function GraphBuilder() {
  const [nodes, setNodes] = useState(START.nodes);
  const [edges, setEdges] = useState<Edge[]>(START.edges);
  const [sel, setSel] = useState<number | null>(null);
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const [seqText, setSeqText] = useState("3, 3, 2, 2, 2");
  const seqNums = seqText.split(/[\s,]+/).filter(Boolean).map(Number).filter((v) => Number.isInteger(v) && v >= 0).slice(0, 10);
  const hh = havelHakimi(seqNums);

  const has = (a: number, b: number) => edges.some(([x, y]) => key(x, y) === key(a, b));
  const degree = nodes.map((_, i) => edges.filter(([a, b]) => a === i || b === i).length);
  const n = nodes.length;
  const complete = (n * (n - 1)) / 2;

  const clickNode = (i: number) => {
    if (sel === null) return setSel(i);
    if (sel !== i) {
      setEdges(has(sel, i) ? edges.filter(([a, b]) => key(a, b) !== key(sel, i)) : [...edges, [sel, i]]);
    }
    setSel(null);
  };

  const addNode = (e: React.MouseEvent<SVGSVGElement>) => {
    if (n >= 8 || (e.target as Element).closest(".g-node")) return;
    const box = e.currentTarget.getBoundingClientRect();
    setNodes([...nodes, { x: ((e.clientX - box.left) / box.width) * W, y: ((e.clientY - box.top) / box.height) * H }]);
  };

  const allPairs = () => {
    const out: Edge[] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) out.push([i, j]);
    return out;
  };

  return (
    <div className="viz viz-graph">
      <div className="viz-row viz-chips">
        <button className="chip" onClick={() => setEdges(allPairs())}>Make complete K{n}</button>
        <button className="chip" onClick={() => setEdges(allPairs().filter(([a, b]) => !has(a, b)))}>Complement</button>
        <button className="chip" onClick={() => setEdges([])}>Clear edges</button>
        <button className="chip" onClick={() => { setNodes(START.nodes); setEdges(START.edges); setSel(null); }}>Reset</button>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="graph-svg" onClick={addNode} role="img" aria-label="Editable graph">
        {edges.map(([a, b]) => (
          <line key={key(a, b)} className="g-edge" x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
        {nodes.map((p, i) => (
          <g
            key={i}
            className={`g-node ${sel === i ? "is-picked" : ""}`}
            transform={`translate(${p.x} ${p.y})`}
            onClick={() => clickNode(i)}
            role="button"
            aria-label={`Vertex ${String.fromCharCode(65 + i)}, degree ${degree[i]}`}
          >
            <circle r="16" />
            <text dy="5">{String.fromCharCode(65 + i)}</text>
            <text className="g-deg" dx="16" dy="-14">{degree[i]}</text>
          </g>
        ))}
      </svg>

      <div className="seg" role="tablist">
        <button role="tab" aria-selected={view === "matrix"} className={view === "matrix" ? "is-on" : ""} onClick={() => setView("matrix")}>Adjacency matrix</button>
        <button role="tab" aria-selected={view === "list"} className={view === "list" ? "is-on" : ""} onClick={() => setView("list")}>Adjacency list</button>
      </div>
      <div className="graph-info">
        {view === "list" ? (
          <ul className="adj-list mono">
            {nodes.map((_, i) => (
              <li key={i}>
                <strong>{String.fromCharCode(65 + i)}</strong> → {nodes.map((_, j) => j).filter((j) => j !== i && has(i, j)).map((j) => String.fromCharCode(65 + j)).join(", ") || "∅"}
              </li>
            ))}
          </ul>
        ) : (
        <table className="adj">
          <thead>
            <tr>
              <th />
              {nodes.map((_, j) => <th key={j}>{String.fromCharCode(65 + j)}</th>)}
            </tr>
          </thead>
          <tbody>
            {nodes.map((_, i) => (
              <tr key={i}>
                <th>{String.fromCharCode(65 + i)}</th>
                {nodes.map((_, j) => (
                  <td key={j} className={i !== j && has(i, j) ? "is-one" : ""}>{i !== j && has(i, j) ? 1 : 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <div className="graph-facts">
          <p>Degree sequence: <strong>({[...degree].sort((a, b) => b - a).join(", ")})</strong></p>
          <p>Edges: <strong>{edges.length}</strong> of {complete} possible</p>
          <p>Sum of degrees = <strong>{degree.reduce((s, d) => s + d, 0)}</strong> = 2 × edges</p>
        </div>
      </div>

      <div className="hh">
        <label className="hh-label">
          Is this degree sequence graphical?
          <input className="expr-input mono" value={seqText} onChange={(e) => setSeqText(e.target.value)} spellCheck={false} />
        </label>
        <ol className="hh-steps mono" key={seqText}>
          {hh.steps.map((s, i) => <li key={i} className="pop" style={{ animationDelay: `${i * 80}ms` }}>{s}</li>)}
        </ol>
        <p className={`badge ${hh.ok ? "is-yes" : "is-no"}`}>{hh.ok ? "Graphical" : "Not graphical"}</p>
      </div>
    </div>
  );
}
