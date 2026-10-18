import { useState } from "react";

type Kind = "ms2" | "ms4" | "lcg" | "lfsr";

/** Middle square exactly as the bank does it: pad the square, keep the middle digits. */
const middleSquare = (x: number, digits: 2 | 4) => {
  const sq = String(x * x).padStart(digits * 2, "0");
  return parseInt(sq.slice(digits / 2, digits / 2 + digits), 10);
};

const LFSR_PRESETS = [
  { taps: [1, 2, 3, 6, 7], seed: "1100101", out: 4 },
  { taps: [3, 4, 7], seed: "1110000", out: 3 },
];

/**
 * Step a pseudo-random generator and see its values land on a ring; when a
 * value repeats, the cycle closes and the period is highlighted.
 */
export default function RngStepper() {
  const [kind, setKind] = useState<Kind>("lcg");
  const [seed, setSeed] = useState(7);
  const [a, setA] = useState(5);
  const [c, setC] = useState(3);
  const [m, setM] = useState(16);
  const [preset, setPreset] = useState(0);
  const [steps, setSteps] = useState(0);

  const reset = () => setSteps(0);

  // Build the sequence of generated values (seed first) up to the current step.
  const seq: number[] = [];
  const lfsrStates: string[] = [];
  const lfsrBits: number[] = [];
  if (kind === "lfsr") {
    const p = LFSR_PRESETS[preset];
    const st = p.seed.split("").map(Number);
    lfsrStates.push(st.join(""));
    for (let i = 0; i < steps; i++) {
      lfsrBits.push(st[st.length - 1]);
      let fb = 0;
      for (const t of p.taps) fb ^= st[t - 1];
      for (let k = st.length - 1; k > 0; k--) st[k] = st[k - 1];
      st[0] = fb;
      lfsrStates.push(st.join(""));
    }
  } else {
    let x = kind === "ms4" ? Math.max(1000, seed) : kind === "ms2" ? Math.max(10, Math.min(99, seed)) : seed % m;
    seq.push(x);
    for (let i = 0; i < steps; i++) {
      x = kind === "lcg" ? (a * x + c) % m : middleSquare(x, kind === "ms2" ? 2 : 4);
      seq.push(x);
    }
  }

  // Period as the bank counts it for LCGs: from the first generated value until it comes back.
  const firstGen = seq[1];
  const back = seq.indexOf(firstGen, 2);
  const period = back > 0 ? back - 1 : null;
  const repeatAt = seq.findIndex((v, i) => seq.indexOf(v) !== i);

  const ring = kind === "lcg" ? m : 0;
  const pos = (v: number) => {
    const t = (v / ring) * Math.PI * 2 - Math.PI / 2;
    return [Math.cos(t) * 92, Math.sin(t) * 92];
  };

  const outputs: number[] = [];
  if (kind === "lfsr") {
    const w = LFSR_PRESETS[preset].out;
    for (let i = 0; i + w <= lfsrBits.length; i += w) outputs.push(parseInt(lfsrBits.slice(i, i + w).join(""), 2));
  }

  return (
    <div className="viz viz-rng">
      <div className="viz-row viz-chips">
        {([["lcg", "LCG"], ["ms2", "Middle square (2-digit)"], ["ms4", "Middle square (4-digit)"], ["lfsr", "LFSR"]] as [Kind, string][]).map(([k, l]) => (
          <button key={k} className={`chip ${k === kind ? "is-on" : ""}`} onClick={() => { setKind(k); setSeed(k === "ms4" ? 1234 : k === "ms2" ? 42 : 7); reset(); }}>{l}</button>
        ))}
      </div>

      {kind === "lcg" && (
        <div className="array-sliders rng-sliders">
          <label>a <strong>{a}</strong><input type="range" min={1} max={15} value={a} onChange={(e) => { setA(+e.target.value); reset(); }} /></label>
          <label>c <strong>{c}</strong><input type="range" min={0} max={15} value={c} onChange={(e) => { setC(+e.target.value); reset(); }} /></label>
          <label>m <strong>{m}</strong><input type="range" min={5} max={32} value={m} onChange={(e) => { setM(+e.target.value); reset(); }} /></label>
          <label>seed <strong>{seed % m}</strong><input type="range" min={0} max={m - 1} value={seed % m} onChange={(e) => { setSeed(+e.target.value); reset(); }} /></label>
        </div>
      )}
      {(kind === "ms2" || kind === "ms4") && (
        <label className="growth-n">
          seed <strong>{seq[0]}</strong>
          <input type="range" min={kind === "ms2" ? 10 : 1000} max={kind === "ms2" ? 99 : 9999} value={seq[0]} onChange={(e) => { setSeed(+e.target.value); reset(); }} />
        </label>
      )}
      {kind === "lfsr" && (
        <div className="viz-row viz-chips">
          {LFSR_PRESETS.map((p, i) => (
            <button key={i} className={`chip chip-sm mono ${i === preset ? "is-on" : ""}`} onClick={() => { setPreset(i); reset(); }}>
              taps [{p.taps.join(",")}] seed {p.seed}
            </button>
          ))}
        </div>
      )}

      {kind === "lcg" && (
        <svg viewBox="-120 -120 240 240" className="mod-svg" role="img" aria-label="LCG values on a ring of m positions">
          <circle r="104" className="mod-face" />
          {Array.from({ length: m }, (_, v) => {
            const [x, y] = pos(v);
            const at = seq.indexOf(v);
            return (
              <g key={v} className={`mod-tick ${v === seq[seq.length - 1] ? "is-here" : at >= 0 ? "is-visited" : ""}`}>
                <circle cx={x} cy={y} r={m > 20 ? 8 : 11} />
                <text x={x} y={y} dy="4" style={{ fontSize: m > 20 ? 9 : 11 }}>{v}</text>
              </g>
            );
          })}
          {seq.slice(1).map((v, i) => {
            const [x1, y1] = pos(seq[i]);
            const [x2, y2] = pos(v);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="rng-hop" />;
          })}
        </svg>
      )}

      {kind === "lfsr" ? (
        <div className="lfsr">
          <div className="lfsr-reg">
            {lfsrStates[lfsrStates.length - 1].split("").map((b, i) => (
              <span key={`${steps}-${i}`} className={`bit bit-sm ${b === "1" ? "is-on" : ""} ${LFSR_PRESETS[preset].taps.includes(i + 1) ? "is-tap" : ""}`}><strong>{b}</strong></span>
            ))}
            <span className="lfsr-out mono">→ {lfsrBits.length ? lfsrBits[lfsrBits.length - 1] : "·"}</span>
          </div>
          <p className="viz-readout mono">
            output bits: {lfsrBits.join("") || "—"}
            <br />
            {LFSR_PRESETS[preset].out}-bit integers: <strong>{outputs.join(" ") || "—"}</strong>
          </p>
        </div>
      ) : (
        <div className="rng-seq">
          {seq.map((v, i) => (
            <span key={i} className={`mono pop ${i === 0 ? "is-seed" : ""} ${i === repeatAt ? "is-repeat" : ""}`}>{v}</span>
          ))}
        </div>
      )}

      <div className="sq-actions">
        <button className="btn" onClick={() => setSteps(steps + 1)} disabled={steps >= 40}>Next</button>
        <button className="btn btn-soft" onClick={() => setSteps(Math.min(40, steps + 10))} disabled={steps >= 40}>+10</button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
      {kind !== "lfsr" && (
        <p className="viz-readout" aria-live="polite">
          {kind === "lcg" && period !== null
            ? `Period = ${period}: the first generated value (${firstGen}) came back after ${period} steps.`
            : repeatAt > 0
            ? `${seq[repeatAt]} repeated, so from here the sequence cycles.`
            : kind === "lcg"
            ? `x(n+1) = (${a}·x(n) + ${c}) mod ${m}`
            : "Square, pad, keep the middle digits. Watch for it collapsing to 0 or a short loop."}
        </p>
      )}
    </div>
  );
}
