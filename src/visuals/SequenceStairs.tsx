import { useState } from "react";

type Kind = "arith" | "geo" | "rec";

/**
 * Bars for the first n terms of a sequence. Drag a₁, d or r and n; the
 * highlighted bars are the partial sum Sₙ. For arithmetic series, the
 * pairing view flips a copy on top so each column sums to a₁ + aₙ.
 */
export default function SequenceStairs() {
  const [kind, setKind] = useState<Kind>("arith");
  const [a1, setA1] = useState(2);
  const [d, setD] = useState(3);
  const [r, setR] = useState(2);
  const [n, setN] = useState(8);
  const [pair, setPair] = useState(false);
  const [c1, setC1] = useState(1);
  const [c2, setC2] = useState(1);

  // Recursive: aₖ = c1·aₖ₋₁ + c2·aₖ₋₂ with a₁ = a₂ = given start (Fibonacci at 1, 1).
  const terms: number[] = [];
  for (let k = 1; k <= n; k++) {
    if (kind === "arith") terms.push(a1 + (k - 1) * d);
    else if (kind === "geo") terms.push(a1 * r ** (k - 1));
    else terms.push(k <= 2 ? a1 : c1 * terms[k - 2] + c2 * terms[k - 3]);
  }
  const sum = terms.reduce((s, t) => s + t, 0);
  const max = Math.max(...terms.map(Math.abs), 1);
  const showPair = pair && kind === "arith";
  const top = showPair ? terms[0] + terms[n - 1] : max;

  const formula =
    kind === "arith"
      ? `aₙ = ${a1} + (n − 1)·${d} → a${n} = ${terms[n - 1]};  Sₙ = n(a₁ + aₙ)/2 = ${n}·(${a1} + ${terms[n - 1]})/2 = ${sum}`
      : kind === "geo"
      ? `aₙ = ${a1}·${r}ⁿ⁻¹ → a${n} = ${terms[n - 1]};  Sₙ = a₁(rⁿ − 1)/(r − 1) = ${r === 1 ? n * a1 : sum}`
      : `aₖ = ${c1}·aₖ₋₁ + ${c2}·aₖ₋₂, a₁ = a₂ = ${a1};  terms: ${terms.join(", ")}`;

  return (
    <div className="viz viz-seq">
      <div className="viz-row viz-chips">
        {([["arith", "Arithmetic"], ["geo", "Geometric"], ["rec", "Recursive"]] as [Kind, string][]).map(([k, l]) => (
          <button key={k} className={`chip ${k === kind ? "is-on" : ""}`} onClick={() => { setKind(k); setPair(false); if (k === "rec") setA1(1); }}>{l}</button>
        ))}
        {kind === "arith" && <button className={`chip ${pair ? "is-on" : ""}`} onClick={() => setPair(!pair)}>Gauss pairing</button>}
      </div>

      <div className="array-sliders">
        <label>a₁ <strong>{a1}</strong><input type="range" min={kind === "rec" ? 1 : -5} max={9} value={a1} onChange={(e) => setA1(+e.target.value)} /></label>
        {kind === "arith" && <label>d <strong>{d}</strong><input type="range" min={-4} max={6} value={d} onChange={(e) => setD(+e.target.value)} /></label>}
        {kind === "geo" && <label>r <strong>{r}</strong><input type="range" min={1} max={3} value={r} onChange={(e) => setR(+e.target.value)} /></label>}
        {kind === "rec" && (
          <div className="viz-chips">
            {([["Fibonacci", 1, 1], ["Pell", 2, 1], ["Jacobsthal", 1, 2]] as [string, number, number][]).map(([name, x, y]) => (
              <button key={name} className={`chip chip-sm ${c1 === x && c2 === y ? "is-on" : ""}`} onClick={() => { setC1(x); setC2(y); }}>{name}</button>
            ))}
          </div>
        )}
        <label>n <strong>{n}</strong><input type="range" min={2} max={12} value={n} onChange={(e) => setN(+e.target.value)} /></label>
      </div>

      <div className="stairs" role="img" aria-label={`First ${n} terms`}>
        {terms.map((t, i) => {
          const mirror = terms[n - 1 - i];
          return (
            <div key={i} className="stair-col">
              <div className="stair-stack">
                {showPair && <span className="stair-bar stair-mirror" style={{ height: `${(Math.max(0, mirror) / top) * 100}%`, animationDelay: `${i * 50}ms` }} />}
                <span className={`stair-bar ${t < 0 ? "is-neg" : ""}`} style={{ height: `${(Math.abs(t) / top) * 100}%`, animationDelay: `${i * 50}ms` }} />
              </div>
              <span className="hist-x mono">{t}</span>
            </div>
          );
        })}
      </div>

      <p className="viz-readout mono" aria-live="polite">
        {formula}
        {showPair && <><br />each column = a₁ + aₙ = {terms[0] + terms[n - 1]}, and there are n of them counted twice: Sₙ = {n}·{terms[0] + terms[n - 1]} / 2 = {sum}</>}
        {!showPair && kind !== "rec" && <><br />S{n} = {sum}</>}
      </p>
    </div>
  );
}
