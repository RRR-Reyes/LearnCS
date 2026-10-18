import { useMemo, useState } from "react";

type Fn = {
  label: string;
  f: (x: number) => number;
  inv?: { label: string; f: (y: number) => number; steps: string[] };
  why?: string;
};

const FNS: Fn[] = [
  { label: "f(x) = 2x + 3", f: (x) => 2 * x + 3, inv: { label: "f⁻¹(y) = (y − 3) / 2", f: (y) => (y - 3) / 2, steps: ["y = 2x + 3", "y − 3 = 2x", "x = (y − 3) / 2"] } },
  { label: "f(x) = (x − 1) / 3", f: (x) => (x - 1) / 3, inv: { label: "f⁻¹(y) = 3y + 1", f: (y) => 3 * y + 1, steps: ["y = (x − 1) / 3", "3y = x − 1", "x = 3y + 1"] } },
  { label: "f(x) = x³", f: (x) => x ** 3, inv: { label: "f⁻¹(y) = ∛y", f: (y) => Math.cbrt(y), steps: ["y = x³", "x = ∛y"] } },
  { label: "f(x) = 1 / x", f: (x) => 1 / x, inv: { label: "f⁻¹(y) = 1 / y", f: (y) => 1 / y, steps: ["y = 1 / x", "xy = 1", "x = 1 / y  (its own inverse)"] } },
  { label: "f(x) = x²", f: (x) => x * x, why: "x and −x share an output, so a reflection fails the vertical-line test: no inverse on ℝ." },
];

const W = 360;
const VIEW = 6;
const s = (v: number) => W / 2 + (v / VIEW) * (W / 2);
const t = (v: number) => W / 2 - (v / VIEW) * (W / 2);

/** Plot f, then mirror it across y = x; the reflection is f⁻¹ when f is one-to-one. */
export default function InverseReflect() {
  const [fn, setFn] = useState(FNS[0]);
  const [mirrored, setMirrored] = useState(false);

  const path = useMemo(() => {
    const pts: string[] = [];
    let pen = false;
    for (let i = 0; i <= 240; i++) {
      const x = -VIEW + (i / 240) * 2 * VIEW;
      const y = fn.f(x);
      if (!Number.isFinite(y) || Math.abs(y) > VIEW * 2) { pen = false; continue; }
      pts.push(`${pen ? "L" : "M"} ${s(x)} ${t(y)}`);
      pen = true;
    }
    return pts.join(" ");
  }, [fn]);

  return (
    <div className="viz viz-inv">
      <div className="viz-row viz-chips">
        {FNS.map((f) => <button key={f.label} className={`chip chip-sm mono ${f === fn ? "is-on" : ""}`} onClick={() => { setFn(f); setMirrored(false); }}>{f.label}</button>)}
      </div>
      <svg viewBox={`0 0 ${W} ${W}`} className="inv-svg" role="img" aria-label={`${fn.label} and its reflection across y = x`}>
        <clipPath id="inv-clip"><rect width={W} height={W} /></clipPath>
        <g clipPath="url(#inv-clip)">
          <line x1="0" y1={t(0)} x2={W} y2={t(0)} className="axis" />
          <line x1={s(0)} y1="0" x2={s(0)} y2={W} className="axis" />
          <line x1={s(-VIEW)} y1={t(-VIEW)} x2={s(VIEW)} y2={t(VIEW)} className="mirror" />
          <path d={path} className="inv-f" />
          {/* The reflection is the same curve with x and y swapped: a CSS transform about the diagonal. */}
          <path d={path} className={`inv-g ${mirrored ? "is-on" : ""} ${fn.inv ? "" : "is-bad"}`} style={{ transformOrigin: `${W / 2}px ${W / 2}px` }} />
        </g>
      </svg>
      <div className="sq-actions">
        <button className="btn" onClick={() => setMirrored(!mirrored)}>{mirrored ? "Hide reflection" : "Reflect across y = x"}</button>
      </div>
      <div className="inv-steps" aria-live="polite">
        {fn.inv ? (
          <>
            {fn.inv.steps.map((st, i) => <span key={st} className="mono pop" style={{ animationDelay: `${i * 120}ms` }}>{st}</span>)}
            <strong className="mono">{fn.inv.label}</strong>
            <small>Check: f⁻¹(f(2)) = {+fn.inv.f(fn.f(2)).toFixed(4)}</small>
          </>
        ) : (
          <p>{fn.why}</p>
        )}
      </div>
    </div>
  );
}
