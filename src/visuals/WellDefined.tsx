import { useState } from "react";

type Rule = { label: string; f: (a: number, b: number) => number | null; ok: boolean; why: string };

/** Rules on fractions a/b; a rule is well defined only if equal fractions always give equal outputs. */
const RULES: Rule[] = [
  { label: "f(a/b) = a + b", f: (a, b) => a + b, ok: false, why: "It reads the numerator and denominator, which change when the fraction is rewritten." },
  { label: "f(a/b) = a", f: (a) => a, ok: false, why: "1/2 and 2/4 are the same number but have different numerators." },
  { label: "f(a/b) = 2a/b", f: (a, b) => (2 * a) / b, ok: true, why: "It only depends on the value a/b (it doubles it), so every form agrees." },
  { label: "f(a/b) = a² / b²", f: (a, b) => (a * a) / (b * b), ok: true, why: "This is (a/b)², a function of the value alone." },
  { label: "f(a/b) = b / a", f: (a, b) => (a === 0 ? null : b / a), ok: false, why: "Equal forms agree, but 0/1 has no output, so f isn't defined on all of ℚ." },
];

const FORMS = [
  [1, 2], [2, 4], [3, 6], [-5, -10],
];
const ZERO = [0, 1];

const fmt = (v: number | null) => (v === null ? "undefined" : Number.isInteger(v) ? String(v) : v.toFixed(3));

/** Feed one number written several ways through a rule; mismatched outputs mean it isn't well defined. */
export default function WellDefined() {
  const [rule, setRule] = useState(RULES[0]);
  const outs = FORMS.map(([a, b]) => rule.f(a, b));
  const agree = outs.every((v) => v === outs[0]);
  const zero = rule.f(ZERO[0], ZERO[1]);

  return (
    <div className="viz viz-wd">
      <div className="viz-row viz-chips">
        {RULES.map((r) => <button key={r.label} className={`chip chip-sm mono ${r === rule ? "is-on" : ""}`} onClick={() => setRule(r)}>{r.label}</button>)}
      </div>
      <p className="wd-caption">The same number, ½, written four ways:</p>
      <div className="wd-rows" key={rule.label}>
        {FORMS.map(([a, b], i) => (
          <div key={i} className={`wd-row ${outs[i] !== outs[0] ? "is-clash" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
            <span className="wd-frac mono"><sup>{a}</sup>⁄<sub>{b}</sub></span>
            <span className="wd-arrow" aria-hidden>→</span>
            <span className="wd-out mono">{fmt(outs[i])}</span>
          </div>
        ))}
        <div className={`wd-row ${zero === null ? "is-clash" : ""}`} style={{ animationDelay: "360ms" }}>
          <span className="wd-frac mono"><sup>0</sup>⁄<sub>1</sub></span>
          <span className="wd-arrow" aria-hidden>→</span>
          <span className="wd-out mono">{fmt(zero)}</span>
        </div>
      </div>
      <div className={`eq-lock ${rule.ok ? "is-locked" : "is-open"}`} aria-live="polite">
        <strong>{rule.ok ? "Well defined" : "Not well defined"}</strong>
        <span>{agree ? "" : "Equal inputs gave different outputs. "}{rule.why}</span>
      </div>
    </div>
  );
}
