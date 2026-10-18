import { useState } from "react";

/**
 * Click a cell of a 2D array to see where it lives in memory under
 * row-major or column-major order, and the formula that finds it.
 */
export default function ArrayAddress() {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [size, setSize] = useState(4);
  const [rowMajor, setRowMajor] = useState(true);
  const [cell, setCell] = useState<[number, number]>([1, 2]);
  const base = 0x2000;

  const [i, j] = [Math.min(cell[0], rows - 1), Math.min(cell[1], cols - 1)];
  const index = rowMajor ? i * cols + j : j * rows + i;
  const addr = base + index * size;
  const order = Array.from({ length: rows * cols }, (_, k) =>
    rowMajor ? [Math.floor(k / cols), k % cols] : [k % rows, Math.floor(k / rows)]
  );

  return (
    <div className="viz viz-array">
      <div className="viz-row viz-chips">
        <button className={`chip ${rowMajor ? "is-on" : ""}`} aria-pressed={rowMajor} onClick={() => setRowMajor(true)}>Row-major (C)</button>
        <button className={`chip ${!rowMajor ? "is-on" : ""}`} aria-pressed={!rowMajor} onClick={() => setRowMajor(false)}>Column-major</button>
      </div>
      <div className="array-sliders">
        <label>rows <strong>{rows}</strong><input type="range" min={2} max={5} value={rows} onChange={(e) => setRows(+e.target.value)} /></label>
        <label>cols <strong>{cols}</strong><input type="range" min={2} max={6} value={cols} onChange={(e) => setCols(+e.target.value)} /></label>
        <label>bytes/elem <strong>{size}</strong><input type="range" min={1} max={8} value={size} onChange={(e) => setSize(+e.target.value)} /></label>
      </div>

      <div className="array-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: rows * cols }, (_, k) => {
          const r = Math.floor(k / cols);
          const c = k % cols;
          const idx = rowMajor ? r * cols + c : c * rows + r;
          const before = idx < index;
          return (
            <button
              key={k}
              className={`array-cell ${r === i && c === j ? "is-picked" : ""} ${before ? "is-before" : ""}`}
              onClick={() => setCell([r, c])}
              aria-label={`A[${r}][${c}]`}
            >
              <small>[{r}][{c}]</small>
              <span>{idx}</span>
            </button>
          );
        })}
      </div>

      <span className="ham-caption">Memory, low address → high</span>
      <div className="mem-strip">
        {order.map(([r, c], k) => (
          <div
            key={`${rowMajor}-${k}`}
            className={`mem-slot ${k === index ? "is-picked" : k < index ? "is-before" : ""}`}
            style={{ animationDelay: `${k * 25}ms` }}
          >
            {r},{c}
          </div>
        ))}
      </div>

      <p className="viz-readout">
        addr(A[{i}][{j}]) = base + ({rowMajor ? `${i}·${cols} + ${j}` : `${j}·${rows} + ${i}`}) × {size} = 0x
        {base.toString(16)} + {index * size} = <strong>0x{addr.toString(16)}</strong>
      </p>
    </div>
  );
}
