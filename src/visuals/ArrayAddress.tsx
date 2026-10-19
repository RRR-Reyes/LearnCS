import { useState } from "react";

/**
 * Click a cell of a 2D array to see where it lives in memory under
 * row-major or column-major order, and the formula that finds it.
 */
export default function ArrayAddress({ mips = false }: { mips?: boolean }) {
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

      {mips && <MipsLines i={i} j={j} rows={rows} cols={cols} size={size} rowMajor={rowMajor} base={base} />}

      <p className="viz-readout">
        addr(A[{i}][{j}]) = base + ({rowMajor ? `${i}·${cols} + ${j}` : `${j}·${rows} + ${i}`}) × {size} = 0x
        {base.toString(16)} + {index * size} = <strong>0x{addr.toString(16)}</strong>
      </p>
    </div>
  );
}

const LOADS: Record<number, string> = { 1: "lb", 2: "lh", 4: "lw", 8: "l.d" };

/** The MIPS a compiler would emit for A[i][j], with each register's value after the line runs. */
function MipsLines({ i, j, rows, cols, size, rowMajor, base }: { i: number; j: number; rows: number; cols: number; size: number; rowMajor: boolean; base: number }) {
  const [outer, inner, span] = rowMajor ? [i, j, cols] : [j, i, rows];
  const index = outer * span + inner;
  const shift = Math.log2(size);
  const scale = Number.isInteger(shift)
    ? shift === 0
      ? null
      : { code: `sll  $t2, $t2, ${shift}`, note: `× ${size} bytes (shift by ${shift})` }
    : { code: `mul  $t2, $t2, ${size}`, note: `× ${size} bytes` };
  const lines: [string, string, string, string][] = [
    [`li   $t0, ${outer}`, rowMajor ? "i" : "j", String(outer), "$t0"],
    [`li   $t1, ${inner}`, rowMajor ? "j" : "i", String(inner), "$t1"],
    [`mul  $t2, $t0, ${span}`, `× ${rowMajor ? "cols" : "rows"}`, String(outer * span), "$t2"],
    ["add  $t2, $t2, $t1", `+ ${rowMajor ? "j" : "i"}`, String(index), "$t2"],
    ...(scale ? [[scale.code, scale.note, String(index * size), "$t2"] as [string, string, string, string]] : []),
    ["add  $t2, $t2, $s0", "+ base ($s0)", "0x" + (base + index * size).toString(16), "$t2"],
    [`${LOADS[size] ?? "lw"}   $t3, 0($t2)`, `load A[${i}][${j}]`, "", ""],
  ];
  return (
    <ol className="mips-code array-mips" aria-label="Generated MIPS">
      {lines.map(([code, note, val, reg], k) => (
        <li key={k}>
          <code>{code}</code>
          <span className="array-mips-note"># {note}</span>
          <span className="array-mips-val">{val && `${reg} = ${val}`}</span>
        </li>
      ))}
    </ol>
  );
}

/** The C-to-MIPS stage: the same grid, plus the code that computes the address. */
export const ArrayToMips = () => <ArrayAddress mips />;
