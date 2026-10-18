import { useState } from "react";

type Regs = Record<string, number>;
type Machine = { pc: number; regs: Regs; mem: number[]; done: boolean; changed: string[] };
type Instr = { text: string; label?: string; run: (m: Machine) => Partial<Machine> & { pc?: number } };

const ARRAY_BASE = 0x1000;

/** Sums a 4-word array in a loop, then stores the total after it. */
const PROGRAM: Instr[] = [
  { text: "addi $t0, $zero, 0", run: (m) => ({ regs: { ...m.regs, $t0: 0 } }) },
  { text: "addi $t1, $zero, 0", run: (m) => ({ regs: { ...m.regs, $t1: 0 } }) },
  { text: "la   $s0, arr", run: (m) => ({ regs: { ...m.regs, $s0: ARRAY_BASE } }) },
  { text: "lw   $t2, 0($s0)", label: "loop:", run: (m) => ({ regs: { ...m.regs, $t2: m.mem[(m.regs.$s0 - ARRAY_BASE) / 4] } }) },
  { text: "add  $t0, $t0, $t2", run: (m) => ({ regs: { ...m.regs, $t0: m.regs.$t0 + m.regs.$t2 } }) },
  { text: "addi $s0, $s0, 4", run: (m) => ({ regs: { ...m.regs, $s0: m.regs.$s0 + 4 } }) },
  { text: "addi $t1, $t1, 1", run: (m) => ({ regs: { ...m.regs, $t1: m.regs.$t1 + 1 } }) },
  { text: "slti $t3, $t1, 4", run: (m) => ({ regs: { ...m.regs, $t3: m.regs.$t1 < 4 ? 1 : 0 } }) },
  { text: "bne  $t3, $zero, loop", run: (m) => (m.regs.$t3 !== 0 ? { pc: 3 } : {}) },
  {
    text: "sw   $t0, 0($s0)",
    run: (m) => {
      const mem = [...m.mem];
      mem[(m.regs.$s0 - ARRAY_BASE) / 4] = m.regs.$t0;
      return { mem };
    },
  },
];

const REG_NAMES = ["$t0", "$t1", "$t2", "$t3", "$s0"];
const fresh = (): Machine => ({
  pc: 0,
  regs: { $t0: 0, $t1: 0, $t2: 0, $t3: 0, $s0: 0 },
  mem: [7, 3, 12, 5, 0],
  done: false,
  changed: [],
});

function step(m: Machine): Machine {
  if (m.done) return m;
  const r = PROGRAM[m.pc].run(m);
  const regs = r.regs ?? m.regs;
  const changed = REG_NAMES.filter((n) => regs[n] !== m.regs[n]);
  const pc = r.pc ?? m.pc + 1;
  return { ...m, ...r, regs, pc, changed, done: pc >= PROGRAM.length };
}

/** Step through a real loop and watch registers and memory change. */
export default function MipsStepper() {
  const [m, setM] = useState<Machine>(fresh);
  const [count, setCount] = useState(0);

  const advance = () => {
    setM(step(m));
    setCount((c) => c + 1);
  };
  const runAll = () => {
    let s = m;
    let c = count;
    while (!s.done && c < 200) {
      s = step(s);
      c++;
    }
    setM(s);
    setCount(c);
  };

  return (
    <div className="viz viz-mips">
      <div className="mips-grid">
        <ol className="mips-code">
          {PROGRAM.map((ins, i) => (
            <li key={i} className={i === m.pc && !m.done ? "is-pc" : ""}>
              <span className="mips-label">{ins.label ?? ""}</span>
              <code>{ins.text}</code>
            </li>
          ))}
        </ol>
        <div className="mips-side">
          <table className="mips-regs">
            <tbody>
              {REG_NAMES.map((n) => (
                <tr key={`${n}-${count}`} className={m.changed.includes(n) ? "is-changed" : ""}>
                  <th>{n}</th>
                  <td>{n === "$s0" && m.regs[n] ? `0x${m.regs[n].toString(16)}` : m.regs[n]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mips-mem">
            {m.mem.map((v, i) => (
              <div
                key={i}
                className={`mem-cell ${m.regs.$s0 === ARRAY_BASE + i * 4 && !m.done ? "is-ptr" : ""} ${i === 4 ? "is-out" : ""}`}
              >
                <small>0x{(ARRAY_BASE + i * 4).toString(16)}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mips-actions">
        <button className="btn" onClick={advance} disabled={m.done}>Step</button>
        <button className="btn btn-soft" onClick={runAll} disabled={m.done}>Run to end</button>
        <button className="btn btn-ghost" onClick={() => { setM(fresh()); setCount(0); }}>Reset</button>
        <span className="mips-count">{count} instructions executed</span>
      </div>
      <p className="viz-readout" aria-live="polite">
        {m.done
          ? `Done: sum ${m.regs.$t0} stored right after the array.`
          : `Next: ${PROGRAM[m.pc].text}`}
      </p>
    </div>
  );
}
