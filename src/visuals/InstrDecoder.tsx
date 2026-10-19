import { useState } from "react";
import type { CSSProperties } from "react";

const REGS = [
  "$zero", "$at", "$v0", "$v1", "$a0", "$a1", "$a2", "$a3",
  "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7",
  "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7",
  "$t8", "$t9", "$k0", "$k1", "$gp", "$sp", "$fp", "$ra",
];

const FUNCTS: Record<number, string> = {
  0x20: "add", 0x21: "addu", 0x22: "sub", 0x23: "subu", 0x24: "and", 0x25: "or", 0x26: "xor", 0x27: "nor",
  0x2a: "slt", 0x00: "sll", 0x02: "srl", 0x03: "sra", 0x08: "jr", 0x18: "mult", 0x1a: "div", 0x10: "mfhi", 0x12: "mflo",
};
const I_OPS: Record<number, string> = { 0x08: "addi", 0x0a: "slti", 0x23: "lw", 0x2b: "sw", 0x04: "beq", 0x05: "bne" };
const J_OPS: Record<number, string> = { 0x02: "j", 0x03: "jal" };

const PRESETS = [
  { label: "add", hex: "012A4020" },
  { label: "sll", hex: "00094080" },
  { label: "lw", hex: "8D090004" },
  { label: "beq", hex: "1109FFFE" },
  { label: "jal", hex: "0C100004" },
];

type Field = { name: string; width: number; color: string; meaning: (v: number) => string };

const reg = (v: number) => REGS[v];
const signed16 = (v: number) => (v & 0x8000 ? v - 0x10000 : v);
const COLORS = { op: "hsl(280 45% 50%)", rs: "hsl(212 80% 48%)", rt: "hsl(140 55% 36%)", rd: "hsl(2 75% 50%)", shamt: "hsl(38 80% 42%)", funct: "hsl(330 60% 48%)", imm: "hsl(190 70% 38%)" };

/** A random R-type word, like the course's decoding questions. */
function randomR() {
  const functs = Object.keys(FUNCTS).map(Number).filter((f) => ![0x08, 0x18, 0x1a, 0x10, 0x12].includes(f));
  const funct = functs[Math.floor(Math.random() * functs.length)];
  const pick = () => 8 + Math.floor(Math.random() * 18);
  const shift = funct <= 3;
  const word = ((shift ? 0 : pick()) << 21) | (pick() << 16) | (pick() << 11) | ((shift ? 1 + Math.floor(Math.random() * 15) : 0) << 6) | funct;
  return (word >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

/**
 * Split a 32-bit machine word into its fields: the opcode picks the format
 * (R, I or J), and the fields name the registers and the operation.
 */
export default function InstrDecoder() {
  const [text, setText] = useState("012A4020");
  const clean = text.trim().replace(/^0x/i, "");
  const valid = /^[0-9a-f]{1,8}$/i.test(clean);
  const word = valid ? parseInt(clean, 16) >>> 0 : 0;
  const bits = Array.from({ length: 32 }, (_, i) => Math.floor(word / 2 ** (31 - i)) % 2);
  const op = word >>> 26;

  let format: "R" | "I" | "J" | "?" = "?";
  let fields: Field[] = [];
  let asm = "Not an instruction this tool knows.";

  const rs = (word >>> 21) & 31;
  const rt = (word >>> 16) & 31;
  const rd = (word >>> 11) & 31;
  const shamt = (word >>> 6) & 31;
  const funct = word & 63;
  const imm = word & 0xffff;

  if (op === 0) {
    format = "R";
    fields = [
      { name: "op", width: 6, color: COLORS.op, meaning: () => "R-type" },
      { name: "rs", width: 5, color: COLORS.rs, meaning: reg },
      { name: "rt", width: 5, color: COLORS.rt, meaning: reg },
      { name: "rd", width: 5, color: COLORS.rd, meaning: reg },
      { name: "shamt", width: 5, color: COLORS.shamt, meaning: (v) => String(v) },
      { name: "funct", width: 6, color: COLORS.funct, meaning: (v) => FUNCTS[v] ?? "?" },
    ];
    const m = FUNCTS[funct];
    if (m) {
      if (["sll", "srl", "sra"].includes(m)) asm = `${m} ${reg(rd)}, ${reg(rt)}, ${shamt}`;
      else if (m === "jr") asm = `jr ${reg(rs)}`;
      else if (m === "mult" || m === "div") asm = `${m} ${reg(rs)}, ${reg(rt)}`;
      else if (m === "mfhi" || m === "mflo") asm = `${m} ${reg(rd)}`;
      else asm = `${m} ${reg(rd)}, ${reg(rs)}, ${reg(rt)}`;
    }
  } else if (I_OPS[op]) {
    format = "I";
    const m = I_OPS[op];
    fields = [
      { name: "op", width: 6, color: COLORS.op, meaning: () => m },
      { name: "rs", width: 5, color: COLORS.rs, meaning: reg },
      { name: "rt", width: 5, color: COLORS.rt, meaning: reg },
      { name: "immediate", width: 16, color: COLORS.imm, meaning: (v) => String(signed16(v)) },
    ];
    const s = signed16(imm);
    if (m === "lw" || m === "sw") asm = `${m} ${reg(rt)}, ${s}(${reg(rs)})`;
    else if (m === "beq" || m === "bne") asm = `${m} ${reg(rs)}, ${reg(rt)}, ${s}   # PC + 4 + (${s}) × 4`;
    else asm = `${m} ${reg(rt)}, ${reg(rs)}, ${s}`;
  } else if (J_OPS[op]) {
    format = "J";
    fields = [
      { name: "op", width: 6, color: COLORS.op, meaning: () => J_OPS[op] },
      { name: "address", width: 26, color: COLORS.imm, meaning: (v) => `× 4 = 0x${(v * 4).toString(16)}` },
    ];
    asm = `${J_OPS[op]} 0x${((word & 0x3ffffff) * 4).toString(16)}`;
  } else {
    fields = [
      { name: "op", width: 6, color: COLORS.op, meaning: () => "unknown" },
      { name: "rest", width: 26, color: "#888", meaning: () => "" },
    ];
  }

  let at = 0;
  const groups = fields.map((f) => {
    const slice = bits.slice(at, at + f.width);
    at += f.width;
    return { ...f, slice, value: slice.reduce((a, b) => a * 2 + b, 0) };
  });

  return (
    <div className="viz dec">
      <div className="viz-row viz-chips">
        <input className="fb-input dec-input" aria-label="Machine word in hex" value={text} onChange={(e) => setText(e.target.value)} />
        {PRESETS.map((p) => (
          <button key={p.hex} className={`chip ${clean.toUpperCase() === p.hex ? "is-on" : ""}`} onClick={() => setText(p.hex)}>
            {p.label}
          </button>
        ))}
        <button className="chip" onClick={() => setText(randomR())}>Random R-type</button>
      </div>

      {valid ? (
        <>
          <div className="dec-fields">
            {groups.map((g) => (
              <div key={g.name} className="dec-field" style={{ "--g": g.color, flexGrow: g.width } as CSSProperties}>
                <span className="dec-name">{g.name} <small>{g.width}</small></span>
                <div className="dec-tiles" style={{ gridTemplateColumns: `repeat(${g.width}, minmax(0, 1fr))` }}>
                  {g.slice.map((b, k) => (
                    <span key={k} className={`dec-bit ${b ? "is-on" : ""}`}>{b}</span>
                  ))}
                </div>
                <span className="dec-val">{g.value}</span>
                <span className="dec-meaning">{g.meaning(g.value)}</span>
              </div>
            ))}
          </div>
          <p className="dec-asm">
            <span className="fx-badge">{format}-type</span>
            <code>{asm}</code>
          </p>
        </>
      ) : (
        <p className="viz-readout">Type up to 8 hex digits, such as 012A4020.</p>
      )}

      <p className="viz-readout">
        The top 6 bits (op) pick the format. R-type uses op 0 and puts the operation in funct; I-type packs a 16-bit
        constant; J-type keeps 26 bits of a jump address.
      </p>
    </div>
  );
}
