import { useState } from "react";

type Regs = Record<string, number>;
type Mem = Record<number, number>;
type Machine = { pc: number; regs: Regs; mem: Mem; done: boolean; changed: string[] };
type Instr = { text: string; label?: string; run: (m: Machine) => { regs?: Regs; mem?: Mem; pc?: number; halt?: boolean } };

/** A program plus everything the panel needs to draw it. */
type Program = {
  code: Instr[];
  regs: string[];
  /** Registers shown in hex (addresses). */
  hexRegs: string[];
  init: Regs;
  cells: { addr: number; label?: string; value: number }[];
  /** The register that points into the memory cells, if any. */
  ptr?: string;
  done: (m: Machine) => string;
};

/** Instruction addresses, so $ra and jr have something real to hold. */
const TEXT_BASE = 0x400000;
const addrOf = (i: number) => TEXT_BASE + i * 4;
const indexOf = (addr: number) => (addr - TEXT_BASE) / 4;
const hex = (n: number) => "0x" + n.toString(16);
const set = (m: Machine, r: Regs) => ({ regs: { ...m.regs, ...r } });

const ARRAY_BASE = 0x1000;

/** Sums a 4-word array in a loop, then stores the total after it. */
const LOOP: Program = {
  code: [
    { text: "addi $t0, $zero, 0", run: (m) => set(m, { $t0: 0 }) },
    { text: "addi $t1, $zero, 0", run: (m) => set(m, { $t1: 0 }) },
    { text: "la   $s0, arr", run: (m) => set(m, { $s0: ARRAY_BASE }) },
    { text: "lw   $t2, 0($s0)", label: "loop:", run: (m) => set(m, { $t2: m.mem[m.regs.$s0] }) },
    { text: "add  $t0, $t0, $t2", run: (m) => set(m, { $t0: m.regs.$t0 + m.regs.$t2 }) },
    { text: "addi $s0, $s0, 4", run: (m) => set(m, { $s0: m.regs.$s0 + 4 }) },
    { text: "addi $t1, $t1, 1", run: (m) => set(m, { $t1: m.regs.$t1 + 1 }) },
    { text: "slti $t3, $t1, 4", run: (m) => set(m, { $t3: m.regs.$t1 < 4 ? 1 : 0 }) },
    { text: "bne  $t3, $zero, loop", run: (m) => (m.regs.$t3 !== 0 ? { pc: 3 } : {}) },
    { text: "sw   $t0, 0($s0)", run: (m) => ({ mem: { ...m.mem, [m.regs.$s0]: m.regs.$t0 } }) },
  ],
  regs: ["$t0", "$t1", "$t2", "$t3", "$s0"],
  hexRegs: ["$s0"],
  init: { $t0: 0, $t1: 0, $t2: 0, $t3: 0, $s0: 0 },
  cells: [7, 3, 12, 5, 0].map((value, i) => ({ addr: ARRAY_BASE + i * 4, value, label: i === 4 ? "sum" : `arr[${i}]` })),
  ptr: "$s0",
  done: (m) => `Done: sum ${m.regs.$t0} stored right after the array.`,
};

const STACK_TOP = 0x7ffc;
const RESULT = 0x1000;

/**
 * main calls twice_plus_one, which calls twice. The inner jal overwrites
 * $ra, so twice_plus_one saves it on the stack first and restores it.
 */
const CALLS: Program = {
  code: [
    { text: "addi $a0, $zero, 5", label: "main:", run: (m) => set(m, { $a0: 5 }) },
    { text: "jal  twice_plus_one", run: (m) => ({ ...set(m, { $ra: addrOf(m.pc + 1) }), pc: 4 }) },
    { text: "sw   $v0, result", run: (m) => ({ mem: { ...m.mem, [RESULT]: m.regs.$v0 } }) },
    { text: "syscall   # exit", run: () => ({ halt: true }) },
    { text: "addi $sp, $sp, -4", label: "twice_plus_one:", run: (m) => set(m, { $sp: m.regs.$sp - 4 }) },
    { text: "sw   $ra, 0($sp)", run: (m) => ({ mem: { ...m.mem, [m.regs.$sp]: m.regs.$ra } }) },
    { text: "jal  twice", run: (m) => ({ ...set(m, { $ra: addrOf(m.pc + 1) }), pc: 11 }) },
    { text: "addi $v0, $v0, 1", run: (m) => set(m, { $v0: m.regs.$v0 + 1 }) },
    { text: "lw   $ra, 0($sp)", run: (m) => set(m, { $ra: m.mem[m.regs.$sp] }) },
    { text: "addi $sp, $sp, 4", run: (m) => set(m, { $sp: m.regs.$sp + 4 }) },
    { text: "jr   $ra", run: (m) => ({ pc: indexOf(m.regs.$ra) }) },
    { text: "add  $v0, $a0, $a0", label: "twice:", run: (m) => set(m, { $v0: m.regs.$a0 * 2 }) },
    { text: "jr   $ra", run: (m) => ({ pc: indexOf(m.regs.$ra) }) },
  ],
  regs: ["$a0", "$v0", "$ra", "$sp"],
  hexRegs: ["$ra", "$sp"],
  init: { $a0: 0, $v0: 0, $ra: 0, $sp: STACK_TOP },
  cells: [
    { addr: 0x7ff4, value: 0, label: "stack" },
    { addr: 0x7ff8, value: 0, label: "stack" },
    { addr: 0x7ffc, value: 0, label: "stack top" },
    { addr: RESULT, value: 0, label: "result" },
  ],
  ptr: "$sp",
  done: (m) => `Done: twice_plus_one(5) = ${m.mem[RESULT]}, and every jr found its way back.`,
};

export const PROGRAMS = { loop: LOOP, calls: CALLS };

const fresh = (p: Program): Machine => ({
  pc: 0,
  regs: { ...p.init },
  mem: Object.fromEntries(p.cells.map((c) => [c.addr, c.value])),
  done: false,
  changed: [],
});

function step(p: Program, m: Machine): Machine {
  if (m.done) return m;
  const r = p.code[m.pc].run(m);
  const regs = r.regs ?? m.regs;
  const changed = p.regs.filter((n) => regs[n] !== m.regs[n]);
  const pc = r.pc ?? m.pc + 1;
  return { ...m, regs, mem: r.mem ?? m.mem, pc, changed, done: !!r.halt || pc >= p.code.length };
}

/** Step through a real program and watch registers and memory change. */
export function MipsStepper({ program: p = LOOP }: { program?: Program }) {
  const [m, setM] = useState<Machine>(() => fresh(p));
  const [count, setCount] = useState(0);
  const showAddr = p === CALLS;

  const advance = () => {
    setM(step(p, m));
    setCount((c) => c + 1);
  };
  const runAll = () => {
    let s = m;
    let c = count;
    while (!s.done && c < 200) {
      s = step(p, s);
      c++;
    }
    setM(s);
    setCount(c);
  };

  return (
    <div className="viz viz-mips">
      <div className="mips-grid">
        <ol className="mips-code">
          {p.code.map((ins, i) => (
            <li key={i} className={`${i === m.pc && !m.done ? "is-pc" : ""} ${ins.label ? "has-label" : ""}`}>
              {showAddr && <span className="mips-addr">{hex(addrOf(i))}</span>}
              <span className="mips-label">{ins.label ?? ""}</span>
              <code>{ins.text}</code>
            </li>
          ))}
        </ol>
        <div className="mips-side">
          <table className="mips-regs">
            <tbody>
              {p.regs.map((n) => (
                <tr key={`${n}-${count}`} className={m.changed.includes(n) ? "is-changed" : ""}>
                  <th>{n}</th>
                  <td>{p.hexRegs.includes(n) && m.regs[n] ? hex(m.regs[n]) : m.regs[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`mips-mem ${showAddr ? "is-stack" : ""}`}>
            {p.cells.map((c) => (
              <div key={c.addr} className={`mem-cell ${p.ptr && m.regs[p.ptr] === c.addr && !m.done ? "is-ptr" : ""} ${c.label === "sum" || c.label === "result" ? "is-out" : ""}`}>
                <small>{hex(c.addr)}{c.label ? ` · ${c.label}` : ""}{p.ptr && m.regs[p.ptr] === c.addr ? ` ← ${p.ptr}` : ""}</small>
                <strong>{p.hexRegs.length > 1 && m.mem[c.addr] >= TEXT_BASE ? hex(m.mem[c.addr]) : m.mem[c.addr]}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mips-actions">
        <button className="btn" onClick={advance} disabled={m.done}>Step</button>
        <button className="btn btn-soft" onClick={runAll} disabled={m.done}>Run to end</button>
        <button className="btn btn-ghost" onClick={() => { setM(fresh(p)); setCount(0); }}>Reset</button>
        <span className="mips-count">{count} instructions executed</span>
      </div>
      <p className="viz-readout" aria-live="polite">
        {m.done ? p.done(m) : `Next: ${p.code[m.pc].text}`}
      </p>
    </div>
  );
}

export default MipsStepper;

/** The subroutine program: jal, jr $ra, and saving $ra on the stack. */
export const CallStepper = () => <MipsStepper program={CALLS} />;
