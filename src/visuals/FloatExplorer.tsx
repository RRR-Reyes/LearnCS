import { useState } from "react";
import type { CSSProperties } from "react";

type Format = { name: string; total: number; exp: number; man: number; bias: number };
const FORMATS: Format[] = [
  { name: "16-bit half", total: 16, exp: 5, man: 10, bias: 15 },
  { name: "32-bit single", total: 32, exp: 8, man: 23, bias: 127 },
];

/** Presets as raw bit patterns per format (same order as the chips). */
const PRESETS: { label: string; bits: [number, number] }[] = [
  { label: "0", bits: [0x0000, 0x00000000] },
  { label: "−0", bits: [0x8000, 0x80000000] },
  { label: "1", bits: [0x3c00, 0x3f800000] },
  { label: "0.1", bits: [0x2e66, 0x3dcccccd] },
  { label: "π", bits: [0x4248, 0x40490fdb] },
  { label: "Largest", bits: [0x7bff, 0x7f7fffff] },
  { label: "Smallest", bits: [0x0001, 0x00000001] },
  { label: "∞", bits: [0x7c00, 0x7f800000] },
  { label: "−∞", bits: [0xfc00, 0xff800000] },
  { label: "NaN", bits: [0x7e00, 0x7fc00000] },
];

const toBits = (n: number, total: number) =>
  Array.from({ length: total }, (_, i) => Math.floor(n / 2 ** (total - 1 - i)) % 2);
const bin = (bits: number[]) => bits.reduce((a, b) => a * 2 + b, 0);
const hexOf = (bits: number[]) =>
  Array.from({ length: bits.length / 4 }, (_, i) => bin(bits.slice(i * 4, i * 4 + 4)).toString(16).toUpperCase()).join("");

const fmt = (v: number) => {
  if (v === 0) return "0";
  const s = parseFloat(v.toPrecision(9));
  return Math.abs(s) >= 1e9 || Math.abs(s) < 1e-4 ? s.toExponential() : String(s);
};

/**
 * Flip the sign, exponent and mantissa bits of a float and watch the value
 * rebuild itself: (−1)^sign × significand × 2^(exponent − bias).
 */
export default function FloatExplorer() {
  const [fi, setFi] = useState(1);
  const f = FORMATS[fi];
  const [bits, setBits] = useState(() => toBits(0x41300000, 32));

  const setFormat = (i: number) => {
    // Keep the same preset-like value by re-decoding: just reset to a 1.5-ish pattern for the new width.
    setFi(i);
    setBits(toBits(i === 0 ? 0x4200 : 0x41300000, FORMATS[i].total));
  };
  const flip = (i: number) => setBits(bits.map((b, k) => (k === i ? b ^ 1 : b)));

  const sign = bits[0];
  const expBits = bits.slice(1, 1 + f.exp);
  const manBits = bits.slice(1 + f.exp);
  const e = bin(expBits);
  const m = bin(manBits);
  const eMax = 2 ** f.exp - 1;

  let kind: "zero" | "subnormal" | "normal" | "infinity" | "nan" = "normal";
  if (e === eMax) kind = m === 0 ? "infinity" : "nan";
  else if (e === 0) kind = m === 0 ? "zero" : "subnormal";

  const power = kind === "subnormal" ? 1 - f.bias : e - f.bias;
  const lead = kind === "normal" ? 1 : 0;
  const significand = lead + m / 2 ** f.man;
  const mantissaText = manBits.join("").replace(/0+$/, "") || "0";
  const value = (sign ? -1 : 1) * significand * 2 ** power;

  const result =
    kind === "nan" ? "NaN" : kind === "infinity" ? (sign ? "−∞" : "+∞") : kind === "zero" ? (sign ? "−0" : "+0") : fmt(value);

  const NOTE: Record<typeof kind, string> = {
    normal: "Normal: the significand has an implicit leading 1.",
    subnormal: "Denormal: exponent bits are all 0, so the leading digit is 0 and the exponent is stuck at 1 − bias.",
    zero: "Zero: every exponent and mantissa bit is 0. The sign bit still makes −0.",
    infinity: "Infinity: exponent bits are all 1 and the mantissa is 0.",
    nan: "NaN: exponent bits are all 1 and the mantissa is not 0.",
  };

  const group = (label: string, from: number, to: number, cls: string) => (
    <div className={`fx-group ${cls}`}>
      <span className="fx-label">{label}</span>
      <div className="fx-tiles">
        {bits.slice(from, to).map((b, k) => (
          <button
            key={from + k}
            className={`fx-tile ${b ? "is-on" : ""}`}
            style={{ "--wh": [-3, 2, 5, -1][k % 4], "--wl": `${[2, -2, 1, -3][k % 4]}%` } as CSSProperties}
            aria-pressed={!!b}
            aria-label={`${label} bit ${k + 1}`}
            onClick={() => flip(from + k)}
          >
            <span className="flip-inner">
              <span className="flip-face flip-front">0</span>
              <span className="flip-face flip-back">1</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="viz fx">
      <div className="viz-row viz-chips">
        {FORMATS.map((x, i) => (
          <button key={x.name} className={`chip ${i === fi ? "is-on" : ""}`} aria-pressed={i === fi} onClick={() => setFormat(i)}>
            {x.name}
          </button>
        ))}
      </div>

      <div className="fx-board">
        <div className="fx-top">
          {group("Sign", 0, 1, "is-sign")}
          {group(`Exponent (${f.exp})`, 1, 1 + f.exp, "is-exp")}
        </div>
        {group(`Mantissa (${f.man})`, 1 + f.exp, f.total, "is-man")}
      </div>

      <div className="viz-row viz-chips">
        {PRESETS.map((p) => (
          <button key={p.label} className="chip" onClick={() => setBits(toBits(p.bits[fi], f.total))}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="fx-eq" aria-live="polite">
        <span className={`fx-badge is-${kind}`}>{kind}</span>
        {kind === "normal" || kind === "subnormal" || kind === "zero" ? (
          <p>
            <span className="is-sign">(−1)<sup>{sign}</sup></span>
            {" × "}
            <span className="is-man">{lead}.{mantissaText}<sub>₂</sub></span>
            {" × "}
            <span className="is-exp">2<sup>{power}</sup></span>
            {" = "}
            <strong>{result}</strong>
          </p>
        ) : (
          <p><strong>{result}</strong></p>
        )}
        <p className="fx-sub">
          exponent bits = <span className="is-exp">{e}</span>
          {kind === "normal" && <> , bias {f.bias} → 2<sup>{e} − {f.bias}</sup></>}
          {" · "}hex <code>0x{hexOf(bits)}</code>
        </p>
      </div>

      <p className="viz-readout">{NOTE[kind]}</p>
    </div>
  );
}
