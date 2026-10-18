import { useState } from "react";

/**
 * Click bits to flip them. The same pattern is read three ways:
 * unsigned, two's complement, and hex.
 */
export default function BitFlipper() {
  const [width, setWidth] = useState<4 | 8>(8);
  const [value, setValue] = useState(0b10110010);
  const [flash, setFlash] = useState<string | null>(null);

  const mask = (1 << width) - 1;
  const v = value & mask;
  const signed = v & (1 << (width - 1)) ? v - (1 << width) : v;
  const bits = Array.from({ length: width }, (_, i) => width - 1 - i);

  const flip = (b: number) => setValue(v ^ (1 << b));

  const bump = (d: 1 | -1) => {
    const next = v + d;
    if (next > mask || next < 0) setFlash("Unsigned wrap-around (carry out)");
    else if (d === 1 && signed === (1 << (width - 1)) - 1) setFlash("Signed overflow: + to −");
    else if (d === -1 && signed === -(1 << (width - 1))) setFlash("Signed overflow: − to +");
    else setFlash(null);
    setValue(next & mask);
  };

  return (
    <div className="viz viz-bits">
      <div className="viz-row viz-chips">
        {[4, 8].map((w) => (
          <button
            key={w}
            className={`chip ${w === width ? "is-on" : ""}`}
            aria-pressed={w === width}
            onClick={() => setWidth(w as 4 | 8)}
          >
            {w}-bit
          </button>
        ))}
        <button className="chip" onClick={() => setValue((~v) & mask)}>Invert</button>
        <button className="chip" onClick={() => setValue((-signed) & mask)}>Negate (invert + 1)</button>
      </div>

      <div className="bits-row" role="group" aria-label="Bits, most significant first">
        {bits.map((b) => {
          const on = (v >> b) & 1;
          const isSign = b === width - 1;
          return (
            <button
              key={b}
              className={`bit ${on ? "is-on" : ""} ${isSign ? "is-sign" : ""}`}
              aria-pressed={!!on}
              aria-label={`bit ${b}`}
              onClick={() => flip(b)}
            >
              <strong>{on}</strong>
              <small>{isSign ? `−2${sup(b)}` : `2${sup(b)}`}</small>
            </button>
          );
        })}
      </div>

      <div className="bits-reads">
        <div><span>Unsigned</span><strong>{v}</strong></div>
        <div><span>Two's complement</span><strong>{signed}</strong></div>
        <div><span>Hex</span><strong>0x{v.toString(16).toUpperCase().padStart(width / 4, "0")}</strong></div>
      </div>

      <div className="bits-counter">
        <button className="btn btn-soft" onClick={() => bump(-1)}>− 1</button>
        <button className="btn" onClick={() => bump(1)}>+ 1</button>
        <span className={`bits-flash ${flash ? "is-on" : ""}`} aria-live="polite">{flash ?? " "}</span>
      </div>

      <p className="viz-readout">
        Range: unsigned 0 … {mask}, signed {-(1 << (width - 1))} … {(1 << (width - 1)) - 1}
      </p>
    </div>
  );
}

const SUPS = "⁰¹²³⁴⁵⁶⁷";
const sup = (n: number) => SUPS[n];
