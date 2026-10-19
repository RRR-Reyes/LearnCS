import { useState } from "react";

/**
 * Which ideas the reading has reached: plain place values and hex, then
 * two's complement, then widening and overflow. Each stage adds controls.
 */
type Stage = "positional" | "signed" | "extend";

/**
 * Click bits to flip them. The same pattern is read as unsigned, as
 * two's complement and as hex, depending on how far the reading has got.
 */
export function BitFlipper({ stage = "extend" }: { stage?: Stage }) {
  const signedOn = stage !== "positional";
  const extendOn = stage === "extend";
  const [width, setWidth] = useState<4 | 8>(extendOn ? 4 : 8);
  const [value, setValue] = useState(extendOn ? 0b1101 : 0b10110010);
  const [flash, setFlash] = useState<string | null>(null);
  const [filled, setFilled] = useState<"sign" | "zero" | null>(null);

  const mask = (1 << width) - 1;
  const v = value & mask;
  const signed = v & (1 << (width - 1)) ? v - (1 << width) : v;
  const bits = Array.from({ length: width }, (_, i) => width - 1 - i);
  const nibbles = Array.from({ length: width / 4 }, (_, k) => (v >> (width - 4 - k * 4)) & 15);

  const change = (next: number) => {
    setValue(next);
    setFilled(null);
  };
  const flip = (b: number) => {
    change(v ^ (1 << b));
    setFlash(null);
  };

  const bump = (d: 1 | -1) => {
    const next = v + d;
    if (next > mask || next < 0) setFlash("Unsigned wrap-around (carry out)");
    else if (d === 1 && signed === (1 << (width - 1)) - 1) setFlash("Signed overflow: + to −");
    else if (d === -1 && signed === -(1 << (width - 1))) setFlash("Signed overflow: − to +");
    else setFlash(null);
    change(next & mask);
  };

  /** Widen 4 → 8 bits: copy the sign bit into the new bits, or fill them with 0. */
  const extend = (how: "sign" | "zero") => {
    const top = how === "sign" && v & 0b1000 ? 0xf0 : 0;
    setWidth(8);
    setValue(top | v);
    setFilled(how);
    setFlash(null);
  };

  return (
    <div className="viz viz-bits">
      <div className="viz-row viz-chips">
        {[4, 8].map((w) => (
          <button
            key={w}
            className={`chip ${w === width ? "is-on" : ""}`}
            aria-pressed={w === width}
            onClick={() => {
              setWidth(w as 4 | 8);
              setFilled(null);
            }}
          >
            {w}-bit
          </button>
        ))}
        {signedOn && (
          <>
            <button className="chip" onClick={() => change((~v) & mask)}>Invert</button>
            <button className="chip" onClick={() => change((-signed) & mask)}>Negate (invert + 1)</button>
          </>
        )}
        {extendOn && width === 4 && (
          <>
            <button className="chip is-new" onClick={() => extend("sign")}>Sign-extend to 8</button>
            <button className="chip is-new" onClick={() => extend("zero")}>Zero-extend to 8</button>
          </>
        )}
      </div>

      <div className="flip-board" role="group" aria-label="Bits, most significant first">
        {bits.map((b) => {
          const on = (v >> b) & 1;
          const isSign = signedOn && b === width - 1;
          return (
            <div key={b} className={`flip-col ${filled && b >= 4 ? `is-filled is-${filled}` : ""}`}>
              <button className={`flip-card ${on ? "is-on" : ""}`} aria-pressed={!!on} aria-label={`bit ${b}`} onClick={() => flip(b)}>
                <span className="flip-inner">
                  <span className="flip-face flip-front">0</span>
                  <span className="flip-face flip-back">1</span>
                </span>
              </button>
              <span className="flip-peg" aria-hidden="true" />
              <span className={`flip-power ${on ? "is-on" : ""}`}>
                {isSign ? "−" : ""}2<sup>{b}</sup>
              </span>
              <span className="flip-weight">{isSign ? "−" : ""}{1 << b}</span>
            </div>
          );
        })}
      </div>

      {!signedOn && (
        <div className="nib-row" style={{ gridTemplateColumns: `repeat(${width / 4}, 1fr)` }} aria-label="Each group of four bits is one hex digit">
          {nibbles.map((n, k) => (
            <div key={k} className="nib">
              <span className="nib-bracket" />
              <span className="nib-bits">{n.toString(2).padStart(4, "0")}</span>
              <strong>{n.toString(16).toUpperCase()}</strong>
              <small>= {n}</small>
            </div>
          ))}
        </div>
      )}

      <div className="bits-reads">
        <div><span>Unsigned</span><strong>{v}</strong></div>
        {signedOn && <div><span>Two's complement</span><strong>{signed}</strong></div>}
        <div><span>Hex</span><strong>0x{v.toString(16).toUpperCase().padStart(width / 4, "0")}</strong></div>
      </div>

      {extendOn && (
        <div className="bits-counter">
          <button className="btn btn-soft" onClick={() => bump(-1)}>− 1</button>
          <button className="btn" onClick={() => bump(1)}>+ 1</button>
          <span className={`bits-flash ${flash ? "is-on" : ""}`} aria-live="polite">{flash ?? " "}</span>
        </div>
      )}

      <p className="viz-readout">
        {filled === "sign"
          ? `Sign extension copied the sign bit into the 4 new bits, so the signed value is still ${signed}.`
          : filled === "zero"
          ? `Zero extension filled the new bits with 0: the unsigned value is still ${v}, but the signed value went from ${(v & 8 ? (v & 15) - 16 : v & 15)} (4-bit) to ${signed}.`
          : signedOn
          ? `Range: unsigned 0 … ${mask}, signed ${-(1 << (width - 1))} … ${(1 << (width - 1)) - 1}`
          : `Range: 0 … ${mask}. Each group of four bits is one hex digit.`}
      </p>
    </div>
  );
}

export default BitFlipper;

export const BitsPositional = () => <BitFlipper stage="positional" />;
export const BitsSigned = () => <BitFlipper stage="signed" />;
export const BitsExtend = () => <BitFlipper stage="extend" />;
