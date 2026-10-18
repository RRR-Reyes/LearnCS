import { useState } from "react";

/** Positions 1..7; parity bits sit at the powers of two (1, 2, 4). */
const PARITY = [1, 2, 4];
const DATA_POS = [3, 5, 6, 7];

/** Even-parity Hamming(7,4): each parity bit covers positions whose index has that bit set. */
function encode(data: number[]) {
  const word = Array(8).fill(0);
  DATA_POS.forEach((p, i) => (word[p] = data[i]));
  for (const p of PARITY) {
    let x = 0;
    for (let i = 1; i <= 7; i++) if (i & p && i !== p) x ^= word[i];
    word[p] = x;
  }
  return word;
}

const syndromeOf = (word: number[]) =>
  PARITY.reduce((s, p) => {
    let x = 0;
    for (let i = 1; i <= 7; i++) if (i & p) x ^= word[i];
    return s + (x ? p : 0);
  }, 0);

/**
 * Set the four data bits, then flip any one bit of the sent word to
 * simulate noise. The receiver's parity checks point at the bad bit.
 */
export default function HammingCode() {
  const [data, setData] = useState([1, 0, 1, 1]);
  const [noise, setNoise] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const sent = encode(data);
  const received = sent.map((b, i) => (i === noise ? b ^ 1 : b));
  const syndrome = syndromeOf(received);

  return (
    <div className="viz viz-hamming">
      <div className="ham-data">
        <span className="ham-caption">Data bits</span>
        {data.map((b, i) => (
          <button
            key={i}
            className={`bit ${b ? "is-on" : ""}`}
            aria-pressed={!!b}
            onClick={() => {
              const next = [...data];
              next[i] ^= 1;
              setData(next);
              setNoise(null);
            }}
          >
            <strong>{b}</strong>
            <small>d{i + 1}</small>
          </button>
        ))}
      </div>

      <span className="ham-caption">Received word — click a bit to corrupt it</span>
      <div className="ham-word">
        {Array.from({ length: 7 }, (_, k) => k + 1).map((pos) => {
          const isParity = PARITY.includes(pos);
          const covered = hover !== null && (pos & hover) !== 0;
          return (
            <button
              key={pos}
              className={`ham-bit ${isParity ? "is-parity" : ""} ${received[pos] ? "is-on" : ""} ${
                noise === pos ? "is-noisy" : ""
              } ${covered ? "is-covered" : ""} ${syndrome === pos ? "is-found" : ""}`}
              onClick={() => setNoise(noise === pos ? null : pos)}
              aria-label={`position ${pos}${isParity ? ", parity" : ""}`}
            >
              <strong>{received[pos]}</strong>
              <small>{isParity ? `p${pos}` : `d${DATA_POS.indexOf(pos) + 1}`}</small>
              <em>{pos}</em>
            </button>
          );
        })}
      </div>

      <div className="ham-checks">
        {PARITY.map((p) => {
          const members = Array.from({ length: 7 }, (_, k) => k + 1).filter((i) => i & p);
          const ok = members.reduce((x, i) => x ^ received[i], 0) === 0;
          return (
            <div
              key={p}
              className={`ham-check ${ok ? "is-ok" : "is-bad"}`}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            >
              <strong>p{p}</strong> checks {members.join(", ")} → {ok ? "even ✓" : "odd ✗"}
            </div>
          );
        })}
      </div>

      <p className="viz-readout" aria-live="polite">
        Syndrome = {syndrome.toString(2).padStart(3, "0")}₂ ={" "}
        <strong>{syndrome === 0 ? "0 → no error" : `${syndrome} → flip position ${syndrome}`}</strong>
      </p>
    </div>
  );
}
