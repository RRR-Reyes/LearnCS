import { useState } from "react";
import type { CSSProperties } from "react";

type Format = { name: string; exp: number; man: number; bias: number };
const FORMATS: Format[] = [
  { name: "32-bit (bias 127)", exp: 8, man: 23, bias: 127 },
  { name: "16-bit (bias 15)", exp: 5, man: 10, bias: 15 },
];
const PRESETS = ["10.5", "0.75", "-6.25", "100", "0.1"];

/** Binary digits after the point, up to n of them; `exact` is false if cut short. */
function fracDigits(x: number, n: number) {
  let f = x - Math.floor(x);
  let s = "";
  while (f > 0 && s.length < n) {
    f *= 2;
    const d = Math.floor(f);
    s += d;
    f -= d;
  }
  return { digits: s, exact: f === 0 };
}

const toBits = (n: number, width: number) => Array.from({ length: width }, (_, i) => Math.floor(n / 2 ** (width - 1 - i)) % 2);
const hexOf = (bits: number[]) =>
  Array.from({ length: bits.length / 4 }, (_, i) => bits.slice(i * 4, i * 4 + 4).reduce((a, b) => a * 2 + b, 0).toString(16).toUpperCase()).join("");

function Tiles({ bits, label, cls }: { bits: number[]; label: string; cls: string }) {
  return (
    <div className={`fx-group ${cls}`}>
      <span className="fx-label">{label}</span>
      <div className="fx-tiles">
        {bits.map((b, k) => (
          <span key={k} className={`fx-tile ${b ? "is-on" : ""}`} style={{ "--wh": [-3, 2, 5, -1][k % 4], "--wl": `${[2, -2, 1, -3][k % 4]}%` } as CSSProperties}>
            <span className="flip-inner">
              <span className="flip-face flip-front">0</span>
              <span className="flip-face flip-back">1</span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Type a number and follow it into a float: sign, binary, normalize,
 * add the bias to the exponent, keep the bits after the leading 1.
 */
export default function FloatBuilder() {
  const [text, setText] = useState("10.5");
  const [fi, setFi] = useState(0);
  const f = FORMATS[fi];
  const maxE = f.bias;
  const minE = 1 - f.bias;

  const x = text.trim() === "" ? NaN : Number(text);
  const valid = !Number.isNaN(x);
  const neg = x < 0 || Object.is(x, -0);
  const a = Math.abs(x);

  let e = 0;
  if (valid && a > 0 && Number.isFinite(a)) {
    e = Math.floor(Math.log2(a));
    if (2 ** e > a) e--;
    if (2 ** (e + 1) <= a) e++;
  }

  // Exact digits after the leading 1 (a double has at most 52), then round to nearest, ties to even.
  const man = fracDigits(a / 2 ** e - 1, 64);
  const kept = man.digits.slice(0, f.man).padEnd(f.man, "0");
  const cut = man.digits.slice(f.man);
  const roundUp = cut[0] === "1" && (cut.slice(1).includes("1") || kept.endsWith("1"));
  let mInt = parseInt(kept, 2) + (roundUp ? 1 : 0);
  let eStored = e;
  if (mInt === 2 ** f.man) {
    mInt = 0;
    eStored = e + 1;
  }

  let kind: "normal" | "zero" | "inf" | "tiny" | "bad" = "normal";
  if (!valid) kind = "bad";
  else if (a === 0) kind = "zero";
  else if (!Number.isFinite(a) || eStored > maxE) kind = "inf";
  else if (e < minE) kind = "tiny";

  const expAll = 2 ** f.exp - 1;
  let expVal = eStored + f.bias;
  let manVal = mInt;
  if (kind === "zero" || kind === "bad") [expVal, manVal] = [0, 0];
  if (kind === "inf") [expVal, manVal] = [expAll, 0];
  if (kind === "tiny") {
    expVal = 0;
    manVal = Math.min(2 ** f.man - 1, Math.round(a / 2 ** (minE - f.man)));
  }
  const bits = [neg && kind !== "bad" ? 1 : 0, ...toBits(expVal, f.exp), ...toBits(manVal, f.man)];
  const stored =
    kind === "tiny" ? manVal * 2 ** (minE - f.man) : kind === "normal" ? (1 + mInt / 2 ** f.man) * 2 ** eStored : a;

  const NOTE = {
    bad: "Type a number, such as 10.5 or -0.75.",
    zero: "Zero has no leading 1 to keep, so every exponent and mantissa bit is 0.",
    inf: `Too big for this format: the exponent bits become all 1s and the value is infinity.`,
    tiny: `Too small to normalize: the exponent bits are all 0 and the number is stored as a denormal.`,
  };

  return (
    <div className="viz fb">
      <div className="viz-row viz-chips">
        {FORMATS.map((x2, i) => (
          <button key={x2.name} className={`chip ${i === fi ? "is-on" : ""}`} aria-pressed={i === fi} onClick={() => setFi(i)}>
            {x2.name}
          </button>
        ))}
      </div>
      <div className="viz-row viz-chips">
        <input className="fb-input" inputMode="decimal" aria-label="Number to store" value={text} onChange={(ev) => setText(ev.target.value)} />
        {PRESETS.map((p) => (
          <button key={p} className={`chip ${text === p ? "is-on" : ""}`} onClick={() => setText(p)}>
            {p}
          </button>
        ))}
      </div>

      {kind === "normal" ? (
        <ol className="fb-steps">
          <li>
            <b>Sign.</b> {neg ? "The number is negative" : "The number is positive"}, so the sign bit is{" "}
            <span className="is-sign">{neg ? 1 : 0}</span>. Work with {a} from here on.
          </li>
          <li>
            <b>Binary.</b> {a} in binary is{" "}
            <code>
              {Math.floor(a).toString(2)}.{fracDigits(a, 28).digits || "0"}
              {fracDigits(a, 28).exact ? "" : "…"}
            </code>
          </li>
          <li>
            <b>Normalize.</b> Slide the point until one 1 sits to its left:{" "}
            <code className="is-man">1.{man.digits.slice(0, f.man + 1) || "0"}{man.digits.length > f.man + 1 ? "…" : ""}</code> × 2
            <sup className="is-exp">{e}</sup>. The exponent is <span className="is-exp">{e}</span>.
          </li>
          <li>
            <b>Add the bias.</b> Store <span className="is-exp">{eStored} + {f.bias} = {expVal}</span>, which is{" "}
            <code className="is-exp">{toBits(expVal, f.exp).join("")}</code>. The bias keeps the stored exponent from ever being negative.
          </li>
          <li>
            <b>Keep what follows the 1.</b> The leading 1 is always there, so it is not stored. The {f.man} mantissa bits are{" "}
            <code className="is-man">{toBits(mInt, f.man).join("")}</code>
            {cut.includes("1") && <span className="fb-cut"> (cut off: {cut.slice(0, 8)}{cut.length > 8 ? "…" : ""}, so it rounds {roundUp ? "up" : "down"})</span>}.
          </li>
        </ol>
      ) : (
        <p className="viz-readout">{NOTE[kind]}</p>
      )}

      <div className="fx-board">
        <div className="fx-top">
          <Tiles bits={bits.slice(0, 1)} label="Sign" cls="is-sign" />
          <Tiles bits={bits.slice(1, 1 + f.exp)} label={`Exponent (${f.exp})`} cls="is-exp" />
        </div>
        <Tiles bits={bits.slice(1 + f.exp)} label={`Mantissa (${f.man})`} cls="is-man" />
      </div>

      <p className="viz-readout">
        {kind === "bad" ? (
          "Nothing to store yet."
        ) : kind === "inf" ? (
          <>Stored as <code>0x{hexOf(bits)}</code>, which is {neg ? "−" : "+"}∞.</>
        ) : (
          <>
            Stored as <code>0x{hexOf(bits)}</code>
            {stored !== a ? (
              <>, which is really <strong>{neg ? "−" : ""}{String(parseFloat(stored.toPrecision(9)))}</strong>: the nearest value this format can hold.</>
            ) : (
              <>, exactly {x}.</>
            )}
          </>
        )}
      </p>
    </div>
  );
}
