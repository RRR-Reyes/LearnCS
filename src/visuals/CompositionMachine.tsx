import { useEffect, useState } from "react";
import { split, Stage } from "./Stage";

type Fn = { label: string; f: (x: number) => number };

const FNS: Fn[] = [
  { label: "2x + 1", f: (x) => 2 * x + 1 },
  { label: "x − 3", f: (x) => x - 3 },
  { label: "x²", f: (x) => x * x },
  { label: "3x", f: (x) => 3 * x },
  { label: "x mod 5", f: (x) => ((x % 5) + 5) % 5 },
];

/** Drop a value in and watch it pass through two machines; swap the order to compare g∘f with f∘g. */
function CompositionMachine() {
  const [f, setF] = useState(FNS[0]);
  const [g, setG] = useState(FNS[2]);
  const [x, setX] = useState(3);
  const [gFirst, setGFirst] = useState(false);
  const [stage, setStage] = useState(0);

  const first = gFirst ? g : f;
  const second = gFirst ? f : g;
  const mid = first.f(x);
  const out = second.f(mid);
  const other = (gFirst ? g : f).f((gFirst ? f : g).f(x));
  const nameF = gFirst ? "g" : "f";
  const nameS = gFirst ? "f" : "g";

  // Replay the trip whenever the machines or the input change.
  useEffect(() => {
    setStage(0);
    const t1 = window.setTimeout(() => setStage(1), 350);
    const t2 = window.setTimeout(() => setStage(2), 1000);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [f, g, x, gFirst]);

  const picker = (name: string, cur: Fn, set: (fn: Fn) => void) => (
    <div className="viz-row viz-chips">
      <span className="chip-label">{name}(x) =</span>
      {FNS.map((fn) => <button key={fn.label} className={`chip chip-sm mono ${fn === cur ? "is-on" : ""}`} onClick={() => set(fn)}>{fn.label}</button>)}
    </div>
  );

  return (
    <div className="viz viz-comp">
      {picker("f", f, setF)}
      {picker("g", g, setG)}
      <label className="growth-n">
        input x = <strong>{x}</strong>
        <input type="range" min={-5} max={8} value={x} onChange={(e) => setX(+e.target.value)} />
      </label>
      <button className="chip cart-swap" onClick={() => setGFirst(!gFirst)}>⇄ Swap order (show {gFirst ? "g ∘ f" : "f ∘ g"})</button>

      <Stage>
      <div className="machine-row" aria-live="polite">
        <span className="token mono">{x}</span>
        <span className={`belt ${stage >= 1 ? "is-run" : ""}`} aria-hidden />
        <div className={`machine ${stage === 1 ? "is-busy" : ""}`}><small>{nameF}</small><span className="mono">{first.label}</span></div>
        <span className={`belt ${stage >= 1 ? "is-run" : ""}`} aria-hidden />
        <span className={`token mono ${stage >= 1 ? "pop" : "is-ghost"}`} key={`m${stage >= 1}-${mid}`}>{stage >= 1 ? mid : "?"}</span>
        <span className={`belt ${stage >= 2 ? "is-run" : ""}`} aria-hidden />
        <div className={`machine ${stage === 2 ? "is-busy" : ""}`}><small>{nameS}</small><span className="mono">{second.label}</span></div>
        <span className={`belt ${stage >= 2 ? "is-run" : ""}`} aria-hidden />
        <span className={`token token-out mono ${stage >= 2 ? "pop" : "is-ghost"}`} key={`o${stage >= 2}-${out}`}>{stage >= 2 ? out : "?"}</span>
      </div>

      <p className="viz-readout mono">
        ({nameS} ∘ {nameF})({x}) = {nameS}({nameF}({x})) = {nameS}({mid}) = <strong>{out}</strong>
        <br />
        the other order gives <strong>{other}</strong> · {out === other ? "same here, but that's a coincidence of these inputs" : "different, so composition isn't commutative"}
      </p>
      </Stage>
    </div>
  );
}

export default split(CompositionMachine);
