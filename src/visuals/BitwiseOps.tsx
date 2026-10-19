import { useState } from "react";
import type { CSSProperties } from "react";

const W = 8;
const MASK = 0xff;

type Op = { key: string; asm: string; binary: boolean; fn: (a: number, b: number, sh: number) => number };

const OPS: Op[] = [
  { key: "and", asm: "and", binary: true, fn: (a, b) => a & b },
  { key: "or", asm: "or", binary: true, fn: (a, b) => a | b },
  { key: "xor", asm: "xor", binary: true, fn: (a, b) => a ^ b },
  { key: "nor", asm: "nor", binary: true, fn: (a, b) => ~(a | b) & MASK },
  { key: "sll", asm: "sll", binary: false, fn: (a, _b, s) => (a << s) & MASK },
  { key: "srl", asm: "srl", binary: false, fn: (a, _b, s) => a >>> s },
  // Arithmetic shift copies the sign bit into the vacated high bits.
  { key: "sra", asm: "sra", binary: false, fn: (a, _b, s) => ((((a << 24) >> 24) >> s) & MASK) },
];

const bitsOf = (n: number) => Array.from({ length: W }, (_, i) => (n >> (W - 1 - i)) & 1);
const hex = (n: number) => "0x" + n.toString(16).toUpperCase().padStart(2, "0");

function Register({ name, value, onFlip, tone }: { name: string; value: number; onFlip?: (i: number) => void; tone?: string }) {
  return (
    <div className={`reg ${tone ?? ""}`}>
      <span className="reg-name">{name}</span>
      <div className="reg-bits">
        {bitsOf(value).map((bit, i) => (
          <button
            key={i}
            className={`hl-tile is-btn ${bit ? "is-on" : ""}`}
            style={{ "--wh": [-3, 2, 5, -1][i % 4], "--wl": `${[2, -2, 1, -3][i % 4]}%` } as CSSProperties}
            disabled={!onFlip}
            onClick={() => onFlip?.(W - 1 - i)}
            aria-pressed={!!bit}
            aria-label={`${name} bit ${W - 1 - i}`}
          >
            <span className="flip-inner">
              <span className="flip-face flip-front">0</span>
              <span className="flip-face flip-back">1</span>
            </span>
          </button>
        ))}
      </div>
      <span className="reg-hex">{hex(value)}</span>
    </div>
  );
}

/**
 * Edit $t1 and $t2 bit by bit and watch each instruction combine them.
 * `ops` limits which instructions are offered (the reading introduces them
 * one stage at a time); `fresh` marks the ones the current stage adds.
 */
export function BitwiseOps({ ops: keys, fresh = [], focus }: { ops?: string[]; fresh?: string[]; focus?: string }) {
  const available = keys ? OPS.filter((o) => keys.includes(o.key)) : OPS;
  const [a, setA] = useState(0b11001010);
  const [b, setB] = useState(0b01011100);
  const [op, setOp] = useState(available.find((o) => o.key === focus) ?? available[0]);
  const [sh, setSh] = useState(2);
  const out = op.fn(a, b, sh);

  return (
    <div className="viz viz-bitwise">
      <div className="viz-row viz-chips">
        {available.map((o) => (
          <button key={o.key} className={`chip ${o.key === op.key ? "is-on" : ""} ${fresh.includes(o.key) ? "is-new" : ""}`} aria-pressed={o.key === op.key} onClick={() => setOp(o)}>
            {o.asm}
          </button>
        ))}
      </div>

      <code className="asm-line">
        {op.binary ? `${op.asm} $t0, $t1, $t2` : `${op.asm} $t0, $t1, ${sh}`}
      </code>

      <Register name="$t1" value={a} onFlip={(i) => setA(a ^ (1 << i))} />
      {op.binary ? (
        <Register name="$t2" value={b} onFlip={(i) => setB(b ^ (1 << i))} />
      ) : (
        <label className="shift-slider">
          shift amount = <strong>{sh}</strong>
          <input type="range" min={0} max={7} value={sh} onChange={(e) => setSh(+e.target.value)} />
        </label>
      )}
      <div className="reg-rule" />
      <Register name="$t0" value={out} tone="is-result" />

      <p className="viz-readout">
        {op.key === "sra"
          ? "sra keeps the sign: the leftmost bit is copied into each vacated position."
          : op.key === "srl"
          ? "srl fills vacated high bits with 0, so negative numbers turn positive."
          : op.key === "sll"
          ? `sll by ${sh} multiplies by 2^${sh} (bits pushed out the left are lost).`
          : op.key === "nor"
          ? "nor $t0, $t1, $zero is how MIPS writes NOT."
          : "Each result bit depends only on the two bits directly above it."}
      </p>
    </div>
  );
}

export default BitwiseOps;

/** A stage of the reading: only these instructions, opening on `focus`. */
export const bitwiseStage = (ops: string[], fresh: string[]) => {
  const Stage = () => <BitwiseOps ops={ops} fresh={fresh} focus={fresh[0]} />;
  return Stage;
};
