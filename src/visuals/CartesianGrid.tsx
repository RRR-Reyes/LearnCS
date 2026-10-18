import { useState } from "react";

const POOL_A = ["a", "b", "c", "d"];
const POOL_B = ["1", "2", "3", "4"];

/** Toggle elements of A and B; every ordered pair pops into the grid. Swap to compare A × B with B × A. */
export default function CartesianGrid() {
  const [a, setA] = useState(["a", "b"]);
  const [b, setB] = useState(["1", "2", "3"]);
  const [swapped, setSwapped] = useState(false);

  const A = POOL_A.filter((x) => a.includes(x));
  const B = POOL_B.filter((x) => b.includes(x));
  const rows = swapped ? B : A;
  const cols = swapped ? A : B;
  const toggle = (list: string[], set: (l: string[]) => void, x: string) =>
    set(list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

  const picker = (name: string, pool: string[], list: string[], set: (l: string[]) => void) => (
    <div className="cart-picker">
      <span className="chip-label">{name}</span>
      {pool.map((x) => (
        <button key={x} className={`chip mono ${list.includes(x) ? "is-on" : ""}`} aria-pressed={list.includes(x)} onClick={() => toggle(list, set, x)}>{x}</button>
      ))}
    </div>
  );

  return (
    <div className="viz viz-cart">
      {picker("A", POOL_A, a, setA)}
      {picker("B", POOL_B, b, setB)}
      <button className="chip cart-swap" onClick={() => setSwapped(!swapped)}>⇄ Show {swapped ? "A × B" : "B × A"}</button>

      <div className="cart-board" key={`${swapped}`}>
        {rows.length === 0 || cols.length === 0 ? (
          <div className="cart-empty pop"><strong className="mono">∅</strong><span>One side is empty, so no pairs can be formed.</span></div>
        ) : (
          <table className="cart-table">
            <thead>
              <tr>
                <th className="mono">{swapped ? "B \\ A" : "A \\ B"}</th>
                {cols.map((c) => <th key={c} className="mono">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r}>
                  <th className="mono">{r}</th>
                  {cols.map((c, j) => (
                    <td key={c}><span className="mono pop" style={{ animationDelay: `${(i * cols.length + j) * 35}ms` }}>({r}, {c})</span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="viz-readout mono">
        |{swapped ? "B × A" : "A × B"}| = {rows.length} × {cols.length} = <strong>{rows.length * cols.length}</strong>
        {swapped && rows.length && cols.length ? " · same size, but every pair is reversed" : ""}
      </p>
    </div>
  );
}
