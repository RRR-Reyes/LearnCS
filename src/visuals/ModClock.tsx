import { useEffect, useState } from "react";
import { split, Stage } from "./Stage";

/** Mathematical mod (Python's %): always lands in 0..n-1, even for negative a. */
const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * A clock with n positions. Pick a starting number and watch the hand
 * walk |a| steps (backwards for negative a) to land on a mod n. The number
 * line below shows the floor-division picture: a = n·q + r.
 */
function ModClock() {
  const [n, setN] = useState(7);
  const [a, setA] = useState(17);
  const [pos, setPos] = useState(0);
  const r = mod(a, n);
  const q = Math.floor(a / n);

  // Step the hand one position at a time so the wrap-around is visible.
  useEffect(() => {
    setPos(0);
    const steps = Math.min(Math.abs(a), 60);
    const dir = a < 0 ? -1 : 1;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setPos((p) => p + dir);
      if (i >= steps) window.clearInterval(id);
    }, Math.max(18, 420 / Math.max(steps, 1)));
    return () => window.clearInterval(id);
  }, [a, n]);

  const R = 92;
  const angle = (k: number) => (k / n) * Math.PI * 2 - Math.PI / 2;
  const handAngle = (mod(pos, n) / n) * 360;

  // Number line from −30 to 30 with multiples of n marked; the jump to n·q then the remainder r.
  const LW = 480;
  const lx = (v: number) => 20 + ((v + 30) / 60) * (LW - 40);
  const multiples = Array.from({ length: 61 }, (_, i) => i - 30).filter((v) => mod(v, n) === 0);

  return (
    <div className="viz viz-mod">
      <div className="mod-controls">
        <label>n = <strong>{n}</strong><input type="range" min={2} max={12} value={n} onChange={(e) => setN(+e.target.value)} /></label>
        <label>a = <strong>{a}</strong><input type="range" min={-30} max={30} value={a} onChange={(e) => setA(+e.target.value)} /></label>
      </div>

      <Stage>
      <svg viewBox="-120 -120 240 240" className="mod-svg" role="img" aria-label={`${a} mod ${n} equals ${r}`}>
        <circle r={R + 14} className="mod-face" />
        {Array.from({ length: n }, (_, k) => (
          <g key={k} className={`mod-tick ${mod(pos, n) === k ? "is-here" : ""}`}>
            <circle cx={Math.cos(angle(k)) * R} cy={Math.sin(angle(k)) * R} r="13" />
            <text x={Math.cos(angle(k)) * R} y={Math.sin(angle(k)) * R} dy="4">{k}</text>
          </g>
        ))}
        <line className="mod-hand" x1="0" y1="0" x2="0" y2={-R + 22} style={{ transform: `rotate(${handAngle}deg)` }} />
        <circle r="5" className="mod-pin" />
      </svg>

      <svg viewBox={`0 0 ${LW} 70`} className="numline" role="img" aria-label={`${a} = ${n} times ${q} plus ${r}`}>
        <line x1="20" y1="40" x2={LW - 20} y2="40" className="axis" />
        {multiples.map((v) => (
          <g key={v}>
            <line x1={lx(v)} y1="34" x2={lx(v)} y2="46" className="numline-tick" />
            <text x={lx(v)} y="62" className="numline-label">{v}</text>
          </g>
        ))}
        <path className="numline-jump" d={`M ${lx(0)} 40 Q ${(lx(0) + lx(n * q)) / 2} 6 ${lx(n * q)} 40`} />
        <line x1={lx(n * q)} y1="40" x2={lx(a)} y2="40" className="numline-rem" />
        <circle cx={lx(a)} cy="40" r="6" className="numline-a" />
      </svg>

      <p className="viz-readout mono" aria-live="polite">
        {a} // {n} = <strong>{q}</strong> &nbsp;and&nbsp; {a} % {n} = <strong>{r}</strong> &nbsp;because&nbsp; {a} = {n}·({q}) + {r}
      </p>
      </Stage>
    </div>
  );
}

export default split(ModClock);
