import { useState } from "react";
import { Stage } from "./Stage";

const DOMAIN = ["1", "2", "3", "4"];
const CODOMAIN = ["a", "b", "c", "d"];
const PRESETS: Record<string, (string | null)[]> = {
  Bijection: ["b", "d", "a", "c"],
  "Not onto": ["a", "a", "b", "c"],
  "Not 1-to-1": ["a", "b", "c", "c"],
  "Not a function": ["a", null, "c", "d"],
};

const ROW_Y = (i: number) => 46 + i * 52;

/**
 * Click a domain element, then a codomain element, to draw its arrow.
 * The classification updates as the mapping changes.
 */
export default function FunctionMap() {
  const [map, setMap] = useState<(string | null)[]>(PRESETS.Bijection);
  const [picked, setPicked] = useState<number | null>(null);

  const total = map.every((m) => m !== null);
  const images = map.filter((m): m is string => m !== null);
  const injective = total && new Set(images).size === images.length;
  const surjective = total && CODOMAIN.every((c) => images.includes(c));

  const verdict = !total
    ? "Not a function: some input has no output."
    : injective && surjective
    ? "Bijection: one-to-one and onto, so it has an inverse."
    : injective
    ? "Injective only: no output is hit twice, but some are missed."
    : surjective
    ? "Surjective only: every output is hit, but one is hit twice."
    : "Neither: an output is hit twice and another is missed.";

  const connect = (j: number) => {
    if (picked === null) return;
    const next = [...map];
    next[picked] = next[picked] === CODOMAIN[j] ? null : CODOMAIN[j];
    setMap(next);
    setPicked(null);
  };

  return (
    <div className="viz viz-func">
      <div className="viz-row viz-chips">
        {Object.keys(PRESETS).map((name) => (
          <button key={name} className="chip" onClick={() => setMap(PRESETS[name])}>
            {name}
          </button>
        ))}
      </div>

      <Stage>
      <svg viewBox="0 0 400 250" className="func-svg" role="img" aria-label="Mapping diagram">
        <ellipse cx="90" cy="124" rx="58" ry="116" className="func-set" />
        <ellipse cx="310" cy="124" rx="58" ry="116" className="func-set" />
        <text x="90" y="16" className="func-title">Domain</text>
        <text x="310" y="16" className="func-title">Codomain</text>
        {map.map((m, i) => {
          if (m === null) return null;
          const j = CODOMAIN.indexOf(m);
          return (
            <path
              key={`${i}-${m}`}
              className="func-arrow"
              d={`M 108 ${ROW_Y(i)} C 200 ${ROW_Y(i)}, 200 ${ROW_Y(j)}, 290 ${ROW_Y(j)}`}
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="func-head" />
          </marker>
        </defs>
        {DOMAIN.map((d, i) => (
          <g
            key={d}
            className={`func-node ${picked === i ? "is-picked" : ""} ${map[i] === null ? "is-loose" : ""}`}
            transform={`translate(90 ${ROW_Y(i)})`}
            onClick={() => setPicked(picked === i ? null : i)}
            role="button"
            aria-label={`Input ${d}`}
          >
            <circle r="16" />
            <text dy="5">{d}</text>
          </g>
        ))}
        {CODOMAIN.map((c, j) => {
          const hits = images.filter((x) => x === c).length;
          return (
            <g
              key={c}
              className={`func-node ${picked !== null ? "is-target" : ""} ${hits === 0 ? "is-missed" : hits > 1 ? "is-double" : ""}`}
              transform={`translate(310 ${ROW_Y(j)})`}
              onClick={() => connect(j)}
              role="button"
              aria-label={`Output ${c}`}
            >
              <circle r="16" />
              <text dy="5">{c}</text>
            </g>
          );
        })}
      </svg>

      <div className="func-badges">
        <span className={`badge ${total ? "is-yes" : "is-no"}`}>Function</span>
        <span className={`badge ${injective ? "is-yes" : "is-no"}`}>Injective</span>
        <span className={`badge ${surjective ? "is-yes" : "is-no"}`}>Surjective</span>
      </div>
      <p className="viz-readout" aria-live="polite">{verdict}</p>
      </Stage>
    </div>
  );
}
