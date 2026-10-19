import { useState } from "react";

const BASE = 0x400000;
const BRANCH = 4;
const LINES = [
  "lw   $t0, 0($s0)",
  "lw   $t1, 4($s0)",
  "add  $t2, $t0, $t1",
  "sub  $t3, $t2, $t0",
  "", // the branch, filled in below
  "addi $t4, $zero, 1",
  "addi $t5, $zero, 2",
  "sw   $t2, 8($s0)",
  "jr   $ra",
];
const hex = (n: number) => "0x" + n.toString(16);

/**
 * A branch compares two registers. If it is taken, the next PC is
 * PC + 4 + offset × 4; if not, the program just falls through to PC + 4.
 */
export default function BranchViz() {
  const [op, setOp] = useState<"beq" | "bne">("beq");
  const [t0, setT0] = useState(3);
  const [t1, setT1] = useState(3);
  const [offset, setOffset] = useState(-3);

  const taken = op === "beq" ? t0 === t1 : t0 !== t1;
  const next = BRANCH + 1;
  const target = next + offset;
  const goes = taken ? target : next;

  return (
    <div className="viz br">
      <div className="viz-row viz-chips">
        {(["beq", "bne"] as const).map((o) => (
          <button key={o} className={`chip ${o === op ? "is-on" : ""}`} aria-pressed={o === op} onClick={() => setOp(o)}>
            {o}
          </button>
        ))}
      </div>

      <div className="br-controls">
        {[
          { name: "$t0", v: t0, set: setT0 },
          { name: "$t1", v: t1, set: setT1 },
        ].map((r) => (
          <label key={r.name} className="br-reg">
            <span>{r.name}</span>
            <button className="btn btn-soft" onClick={() => r.set(Math.max(0, r.v - 1))} aria-label={`${r.name} minus one`}>−</button>
            <strong>{r.v}</strong>
            <button className="btn btn-soft" onClick={() => r.set(Math.min(9, r.v + 1))} aria-label={`${r.name} plus one`}>+</button>
          </label>
        ))}
        <label className="br-offset">
          offset <strong>{offset}</strong>
          <input type="range" min={-4} max={3} value={offset} onChange={(e) => setOffset(+e.target.value)} />
        </label>
      </div>

      <ol className="mips-code br-code">
        {LINES.map((text, i) => {
          const isBranch = i === BRANCH;
          return (
            <li key={i} className={`${isBranch ? "is-pc" : ""} ${i === goes ? "is-next" : ""} ${i === target && !isBranch ? "is-target" : ""}`}>
              <span className="mips-addr">{hex(BASE + i * 4)}</span>
              <code>{isBranch ? `${op}  $t0, $t1, ${offset}` : text}</code>
              <span className="br-tag">
                {isBranch ? "← PC" : i === goes ? (taken ? "← taken: runs next" : "← falls through: runs next") : i === target ? "target" : i === next ? "PC + 4" : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="viz-readout" aria-live="polite">
        {t0} {t0 === t1 ? "=" : "≠"} {t1}, so the branch is <strong>{taken ? "taken" : "not taken"}</strong>.{" "}
        {taken
          ? `Next PC = PC + 4 + (${offset}) × 4 = ${hex(BASE + next * 4)} ${offset < 0 ? "−" : "+"} ${Math.abs(offset * 4)} = ${hex(BASE + target * 4)}.`
          : `Next PC = PC + 4 = ${hex(BASE + next * 4)}.`}
      </p>
    </div>
  );
}
