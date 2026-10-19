import { useState } from "react";
import type { CSSProperties } from "react";

const W = 8;
const bitsOf = (n: number) => Array.from({ length: W }, (_, i) => (n >> (W - 1 - i)) & 1);
const hex = (n: number) => "0x" + n.toString(16).toUpperCase().padStart(2, "0");

/** A read-only row of wood tiles; a null value shows blank, dim tiles. */
function BitRow({ value }: { value: number | null }) {
  const bits = value === null ? Array(W).fill(0) : bitsOf(value);
  return (
    <div className={`hl-bits ${value === null ? "is-blank" : ""}`}>
      {bits.map((b, i) => (
        <span
          key={i}
          className={`hl-tile ${b ? "is-on" : ""}`}
          style={{ "--wh": [-3, 2, 5, -1][i % 4], "--wl": `${[2, -2, 1, -3][i % 4]}%` } as CSSProperties}
        >
          <span className="flip-inner">
            <span className="flip-face flip-front">{value === null ? "?" : 0}</span>
            <span className="flip-face flip-back">1</span>
          </span>
        </span>
      ))}
    </div>
  );
}

function Input({ name, value, onChange }: { name: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="hl-input">
      <span className="hl-name">{name}</span>
      <input type="range" min={0} max={255} value={value} aria-label={name} onChange={(e) => onChange(+e.target.value)} />
      <strong className="hl-dec">{value}</strong>
      <BitRow value={value} />
    </div>
  );
}

/**
 * mult and div write two registers: mult splits a 16-bit product across
 * HI and LO, div leaves the remainder in HI and the quotient in LO.
 */
export default function HiLoMachine() {
  const [a, setA] = useState(13);
  const [b, setB] = useState(25);
  const [op, setOp] = useState<"mult" | "div">("mult");

  const undef = op === "div" && b === 0;
  const product = a * b;
  const hi = undef ? null : op === "mult" ? product >> W : a % b;
  const lo = undef ? null : op === "mult" ? product & 0xff : Math.floor(a / b);

  return (
    <div className="viz hl">
      <div className="viz-row viz-chips">
        {(["mult", "div"] as const).map((o) => (
          <button key={o} className={`chip ${o === op ? "is-on" : ""}`} aria-pressed={o === op} onClick={() => setOp(o)}>
            {o}
          </button>
        ))}
      </div>

      <Input name="$t0" value={a} onChange={setA} />
      <Input name="$t1" value={b} onChange={setB} />

      <code className="asm-line">{op} $t0, $t1</code>
      <div className="hl-pipes" aria-hidden="true"><span /><span /></div>

      <div className="hl-out">
        {[
          { name: "HI", value: hi, note: op === "mult" ? "high half" : "remainder" },
          { name: "LO", value: lo, note: op === "mult" ? "low half" : "quotient" },
        ].map((r) => (
          <div key={r.name} className="hl-drawer">
            <span className="hl-name">{r.name} <small>{r.note}</small></span>
            <BitRow value={r.value} />
            <span className="hl-hex">{r.value === null ? "?" : `${r.value} · ${hex(r.value)}`}</span>
          </div>
        ))}
      </div>

      <code className="asm-line hl-move">
        {`mfhi $t2   # $t2 = HI = ${hi ?? "?"}\nmflo $t3   # $t3 = LO = ${lo ?? "?"}`}
      </code>

      <p className="viz-readout" aria-live="polite">
        {undef ? (
          "Dividing by zero: MIPS leaves HI and LO undefined."
        ) : op === "mult" ? (
          <>
            {a} × {b} = {product} = <strong>{hi}</strong> × 256 + <strong>{lo}</strong>.{" "}
            {hi === 0 ? "It fits in LO, so HI is 0." : "It needs more than 8 bits, so it spills into HI."}
          </>
        ) : (
          <>
            {a} ÷ {b} = quotient <strong>{lo}</strong> (LO), remainder <strong>{hi}</strong> (HI).
          </>
        )}
      </p>
    </div>
  );
}
