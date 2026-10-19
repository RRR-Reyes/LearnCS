import { useState } from "react";
import type { CSSProperties } from "react";
import { PARITY, POSITIONS, encode, labelOf, membersOf, syndromeOf } from "./hammingLogic";

/** Slight per-tile shade shifts so the wood doesn't look stamped out. */
const SHADE = [-3, 2, 5, -1];
const shade = (i: number) => ({ "--wh": SHADE[i % 4], "--wl": `${[2, -2, 1, -3][i % 4]}%` } as CSSProperties);

/** A two-sided wood tile: oak shows 0, walnut shows 1. */
function Tile({ on, i, className = "", ...rest }: { on: boolean; i: number; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`hm-tile ${on ? "is-on" : ""} ${className}`} style={shade(i)} aria-pressed={on} {...rest}>
      <span className="flip-inner">
        <span className="flip-face flip-front">0</span>
        <span className="flip-face flip-back">1</span>
      </span>
    </button>
  );
}

/**
 * Set the four data bits, then flip any one bit of the sent word to
 * simulate noise. Each parity check is a brass pipe through the bits it
 * covers; the checks that read odd spell out the bad position in binary.
 */
export default function HammingCode() {
  const [data, setData] = useState([1, 0, 1, 1]);
  const [noise, setNoise] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const sent = encode(data);
  const received = sent.map((b, i) => (i === noise ? b ^ 1 : b));
  const syndrome = syndromeOf(received);
  const isOdd = (p: number) => membersOf(p).reduce((x, i) => x ^ received[i], 0) === 1;

  return (
    <div className="viz viz-hamming">
      <div className="hm-data">
        <span className="ham-caption">Data bits</span>
        {data.map((b, i) => (
          <Tile
            key={i}
            on={!!b}
            i={i}
            className="is-sm"
            aria-label={`data bit ${i + 1}`}
            onClick={() => {
              const next = [...data];
              next[i] ^= 1;
              setData(next);
              setNoise(null);
            }}
          />
        ))}
        <span className="hm-hint">→ the sender adds p1, p2, p4</span>
      </div>

      <span className="ham-caption">Received word — click a bit to corrupt it</span>
      <div className="hm-grid hm-word">
        {POSITIONS.map((pos, k) => {
          const parity = PARITY.includes(pos);
          const covered = hover !== null && (pos & hover) !== 0;
          return (
            <div
              key={pos}
              className={`hm-cell ${parity ? "is-parity" : ""} ${covered ? "is-covered" : ""} ${noise === pos ? "is-noisy" : ""} ${
                syndrome === pos ? "is-found" : ""
              }`}
            >
              <Tile
                on={received[pos] === 1}
                i={k}
                aria-label={`position ${pos}${parity ? ", parity" : ""}`}
                onClick={() => setNoise(noise === pos ? null : pos)}
              />
              <span className="hm-label">{labelOf(pos)}</span>
              <span className="hm-bin">{pos.toString(2).padStart(3, "0")}</span>
            </div>
          );
        })}
      </div>

      <div className="hm-checks">
        {PARITY.map((p) => {
          const ok = !isOdd(p);
          const mem = membersOf(p);
          return (
            <div
              key={p}
              className={`hm-grid hm-check ${ok ? "is-ok" : "is-bad"}`}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="hm-pipe" />
              {POSITIONS.map((pos) => (
                <span key={pos} style={{ gridColumn: pos }} className={`hm-dot ${mem.includes(pos) ? (received[pos] ? "is-on" : "is-off") : "is-gap"}`}>
                  {mem.includes(pos) ? received[pos] : ""}
                </span>
              ))}
              <span className="hm-status">
                <strong>p{p}</strong> {ok ? "even ✓" : "odd ✗"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="hm-synd" aria-live="polite">
        <div className="hm-lamps">
          {[...PARITY].reverse().map((p) => (
            <span key={p} className={`hm-lamp ${isOdd(p) ? "is-odd" : ""}`}>
              <b>{isOdd(p) ? 1 : 0}</b>
              <i>p{p}</i>
            </span>
          ))}
        </div>
        <p className="viz-readout">
          Syndrome = {syndrome.toString(2).padStart(3, "0")}₂ ={" "}
          <strong>{syndrome === 0 ? "0 → no error" : `${syndrome} → flip position ${syndrome}`}</strong>
        </p>
      </div>
    </div>
  );
}

