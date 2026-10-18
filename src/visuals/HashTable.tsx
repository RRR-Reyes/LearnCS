import { useState } from "react";

type Mode = "chain" | "linear";

/**
 * Insert keys into a table of size N with h(k) = k mod N. Separate chaining
 * hangs collisions off a bucket; linear probing walks to the next free slot.
 */
export default function HashTable() {
  const [mode, setMode] = useState<Mode>("linear");
  const [n, setN] = useState(7);
  const [keys, setKeys] = useState<number[]>([18, 41, 22, 44, 59, 32]);
  const [input, setInput] = useState("31");
  const [probe, setProbe] = useState<number[]>([]);

  // Rebuild the table from the inserted keys so mode and size changes stay consistent.
  const chains: number[][] = Array.from({ length: n }, () => []);
  const slots: (number | null)[] = Array(n).fill(null);
  let lastProbe: number[] = [];
  for (const k of keys) {
    chains[k % n].push(k);
    const path: number[] = [];
    let i = k % n;
    for (let t = 0; t < n; t++, i = (i + 1) % n) {
      path.push(i);
      if (slots[i] === null) {
        slots[i] = k;
        break;
      }
    }
    lastProbe = path;
  }
  const full = mode === "linear" && slots.every((s) => s !== null);
  const load = (keys.length / n).toFixed(2);

  const insert = () => {
    const k = Number(input);
    if (!input || keys.includes(k) || full) return;
    setKeys([...keys, k]);
    setInput(String(Math.floor(Math.random() * 90) + 10));
  };

  // Show the probe path of the most recent insert.
  const shownProbe = probe.length ? probe : lastProbe;

  return (
    <div className="viz viz-hash">
      <div className="viz-row viz-chips">
        <button className={`chip ${mode === "linear" ? "is-on" : ""}`} aria-pressed={mode === "linear"} onClick={() => setMode("linear")}>Linear probing</button>
        <button className={`chip ${mode === "chain" ? "is-on" : ""}`} aria-pressed={mode === "chain"} onClick={() => setMode("chain")}>Separate chaining</button>
        <label className="hash-n">
          N = <strong>{n}</strong>
          <input type="range" min={5} max={13} value={n} onChange={(e) => { setN(+e.target.value); setProbe([]); }} />
        </label>
      </div>

      <div className="hash-table">
        {Array.from({ length: n }, (_, i) => {
          const onPath = mode === "linear" && shownProbe.includes(i);
          const isEnd = mode === "linear" && shownProbe[shownProbe.length - 1] === i;
          return (
            <div key={i} className={`hash-row ${onPath ? "is-path" : ""} ${isEnd ? "is-end" : ""}`}>
              <span className="hash-idx">{i}</span>
              {mode === "linear" ? (
                <span className={`hash-cell ${slots[i] === null ? "is-empty" : ""}`}>{slots[i] ?? "—"}</span>
              ) : (
                <span className="hash-chain">
                  {chains[i].length ? chains[i].map((k) => <span key={k} className="hash-link">{k}</span>) : <span className="hash-cell is-empty">—</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sq-actions">
        <input className="num-input" value={input} inputMode="numeric" aria-label="Key" onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} />
        <button className="btn" onClick={insert} disabled={full}>insert</button>
        <button className="btn btn-ghost" onClick={() => { setKeys([]); setProbe([]); }}>Clear</button>
      </div>
      <p className="viz-readout" aria-live="polite">
        h({keys[keys.length - 1] ?? "k"}) = {keys.length ? `${keys[keys.length - 1]} mod ${n} = ${keys[keys.length - 1] % n}` : `k mod ${n}`}
        {mode === "linear" && shownProbe.length > 1 ? ` · collided, probed ${shownProbe.length} slots` : ""} · load factor λ = {load}
        {full ? " · table full" : ""}
      </p>
    </div>
  );
}
