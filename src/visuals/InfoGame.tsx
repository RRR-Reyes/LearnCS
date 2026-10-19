import { useState } from "react";

const SIZES = [2, 8, 16, 32, 100];

/**
 * Twenty questions with the best possible strategy: every yes/no question
 * halves what is left, so finding 1 of N takes about log₂ N questions.
 * Each answer is one bit, and for a power of two they spell the number.
 */
export default function InfoGame() {
  const [n, setN] = useState(16);
  const [secret, setSecret] = useState(() => Math.floor(Math.random() * 16));
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(15);
  const [answers, setAnswers] = useState<{ q: string; yes: boolean }[]>([]);

  const restart = (size = n) => {
    setN(size);
    setSecret(Math.floor(Math.random() * size));
    setLo(0);
    setHi(size - 1);
    setAnswers([]);
  };

  const found = lo === hi;
  const mid = Math.floor((lo + hi) / 2);
  const ask = () => {
    const yes = secret <= mid;
    setAnswers([...answers, { q: `Is it ≤ ${mid}?`, yes }]);
    if (yes) setHi(mid);
    else setLo(mid + 1);
  };

  const need = Math.log2(n);
  const pow2 = Number.isInteger(need);

  return (
    <div className="viz info">
      <div className="viz-row viz-chips">
        {SIZES.map((s) => (
          <button key={s} className={`chip ${s === n ? "is-on" : ""}`} aria-pressed={s === n} onClick={() => restart(s)}>
            N = {s}
          </button>
        ))}
      </div>

      <div className="info-cells" style={{ gridTemplateColumns: `repeat(${Math.min(n, n > 32 ? 20 : 16)}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }, (_, k) => (
          <span key={k} className={`info-cell ${k < lo || k > hi ? "is-out" : ""} ${found && k === secret ? "is-found" : ""}`}>
            {n <= 32 ? k : ""}
          </span>
        ))}
      </div>

      <div className="mips-actions">
        <button className="btn" onClick={ask} disabled={found}>
          {found ? "Found it" : `Ask: is it ≤ ${mid}?`}
        </button>
        <button className="btn btn-ghost" onClick={() => restart()}>New secret</button>
        <span className="mips-count">{answers.length} questions asked · {hi - lo + 1} left</span>
      </div>

      {answers.length > 0 && (
        <ol className="info-log">
          {answers.map((a, k) => (
            <li key={k}>
              {a.q} <strong>{a.yes ? "yes" : "no"}</strong>
              <span className="info-bit">bit {a.yes ? 0 : 1}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="viz-readout" aria-live="polite">
        {found ? (
          <>
            It's <strong>{secret}</strong>, found in {answers.length} questions. log₂ {n} = {pow2 ? need : need.toFixed(2)}
            {pow2
              ? `, and the answers read as bits are ${answers.map((a) => (a.yes ? 0 : 1)).join("")}₂ = ${secret}.`
              : `, so ${Math.ceil(need)} questions always suffice.`}
          </>
        ) : (
          <>
            {n} equally likely outcomes carry log₂ {n} = {pow2 ? need : need.toFixed(2)} bits, so you need {pow2 ? need : `${Math.floor(need)} or ${Math.ceil(need)}`} yes/no questions.
          </>
        )}
      </p>
    </div>
  );
}
