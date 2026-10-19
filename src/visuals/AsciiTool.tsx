import { useState } from "react";
import type { CSSProperties } from "react";

const show = (code: number) => (code < 32 ? String.fromCharCode(0x2400 + code) : code === 127 ? "␡" : code === 32 ? "␣" : String.fromCharCode(code));
const PLACES = [64, 32, 16, 8, 4, 2, 1];

/**
 * Type a word, pick a letter and read its 7-bit code. Flip bits to change
 * the letter; bit 5 (worth 32) is the one that switches upper and lower case.
 */
export default function AsciiTool() {
  const [text, setText] = useState("Hi!");
  const [idx, setIdx] = useState(0);
  const codes = Array.from(text).map((c) => c.charCodeAt(0) & 127);
  const i = Math.min(idx, Math.max(0, codes.length - 1));
  const code = codes[i] ?? 0;
  const bits = PLACES.map((p) => (code & p ? 1 : 0));

  const setCode = (next: number) => {
    const chars = codes.map((c) => String.fromCharCode(c));
    chars[i] = String.fromCharCode(next);
    setText(chars.join(""));
  };

  const letter = /[A-Za-z]/.test(String.fromCharCode(code));

  return (
    <div className="viz asc">
      <input
        className="fb-input asc-input"
        aria-label="Text to encode"
        maxLength={10}
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^\x00-\x7f]/g, ""))}
      />

      <div className="asc-word" role="group" aria-label="Characters">
        {codes.map((c, k) => (
          <button key={k} className={`asc-char ${k === i ? "is-on" : ""}`} onClick={() => setIdx(k)} aria-pressed={k === i}>
            <strong>{show(c)}</strong>
            <small>{c.toString(16).toUpperCase().padStart(2, "0")}</small>
          </button>
        ))}
      </div>

      {codes.length > 0 && (
        <>
          <div className="asc-board">
            {bits.map((b, k) => (
              <div key={k} className={`asc-col ${PLACES[k] === 32 ? "is-case" : ""}`}>
                <span className="asc-place">{PLACES[k]}</span>
                <button
                  className={`hl-tile is-btn asc-tile ${b ? "is-on" : ""}`}
                  style={{ "--wh": [-3, 2, 5, -1][k % 4], "--wl": `${[2, -2, 1, -3][k % 4]}%` } as CSSProperties}
                  aria-pressed={!!b}
                  aria-label={`bit worth ${PLACES[k]}`}
                  onClick={() => setCode(code ^ PLACES[k])}
                >
                  <span className="flip-inner">
                    <span className="flip-face flip-front">0</span>
                    <span className="flip-face flip-back">1</span>
                  </span>
                </button>
              </div>
            ))}
            <div className="asc-result">
              <strong>{show(code)}</strong>
              <span>
                {code} · 0x{code.toString(16).toUpperCase().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="viz-row viz-chips">
            <button className="chip" onClick={() => setCode(code ^ 32)} disabled={!letter}>
              Flip the case bit (32)
            </button>
            <button className="chip" onClick={() => setCode((code + 1) & 127)}>Next code</button>
          </div>
        </>
      )}

      <p className="viz-readout">
        {letter
          ? `'${show(code)}' is ${code}. Uppercase letters start at 65 ('A') and lowercase at 97 ('a'), so the two cases differ only in the bit worth 32.`
          : code < 32 || code === 127
          ? `${code} is a control code, not a printable character.`
          : `'${show(code)}' is ${code}. Digits start at 48 ('0'), so a digit's code minus 48 is its value.`}
      </p>
    </div>
  );
}
