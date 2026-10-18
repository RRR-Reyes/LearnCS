import { useState } from "react";
import type { Checkpoint } from "../courses";
import MathText from "./MathText";

/** A one-question check placed inside the reading; answers stay visible once chosen. */
export default function CheckpointCard({ cp }: { cp: Checkpoint }) {
  const [pick, setPick] = useState<number | null>(null);
  const answered = pick !== null;
  const right = pick === cp.answer;

  return (
    <div className={`checkpoint ${answered ? (right ? "is-right" : "is-wrong") : ""}`}>
      <span className="checkpoint-tag">Check yourself</span>
      <p className="checkpoint-q"><MathText text={cp.prompt} /></p>
      <div className="checkpoint-opts" role="radiogroup" aria-label={cp.prompt}>
        {cp.options.map((o, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={pick === i}
            className={`opt ${answered && i === cp.answer ? "is-answer" : ""} ${pick === i && !right ? "is-miss" : ""}`}
            onClick={() => setPick(i)}
          >
            <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
            <span><MathText text={o} /></span>
          </button>
        ))}
      </div>
      {answered && (
        <p className="checkpoint-why" aria-live="polite">
          <strong>{right ? "Correct." : "Not quite."}</strong> <MathText text={cp.explanation} />
          {!right && (
            <button className="link-btn" onClick={() => setPick(null)}>Try again</button>
          )}
        </p>
      )}
    </div>
  );
}
