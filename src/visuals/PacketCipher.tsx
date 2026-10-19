import { useState } from "react";
import { split, Stage } from "./Stage";

/** Same alphabet as the question bank: A=0 … Z=25, "_" = 26. */
const toNum = (ch: string) => (ch === "_" ? 26 : ch.charCodeAt(0) - 65);
const toChar = (n: number) => (n === 26 ? "_" : String.fromCharCode(n + 65));

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
function modInverse(a: number, m: number) {
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
  return null;
}

/** Valid moduli must exceed the largest packet (27^size − 1) so decryption is unique. */
const N_FOR: Record<number, number[]> = { 1: [29, 31, 37], 2: [757, 761, 769], 3: [19687, 19697, 19699] };

/**
 * The bank's simple cryptosystem: letters become numbers, each packet of
 * `size` letters is read as one base-27 number p, and c = p·K mod N.
 * Decrypting multiplies by K⁻¹ mod N and reads the base-27 digits back.
 */
function PacketCipher() {
  const [msg, setMsg] = useState("MATH");
  const [size, setSize] = useState(2);
  const [N, setN] = useState(N_FOR[2][0]);
  const [K, setK] = useState(17);
  const [show, setShow] = useState<number | null>(null);

  const clean = msg.toUpperCase().replace(/[^A-Z_]/g, "").slice(0, 12) || "A";
  const nums = clean.split("").map(toNum);
  while (nums.length % size !== 0) nums.push(26);
  const kOk = gcd(K, N) === 1;
  const kInv = kOk ? modInverse(K, N) : null;

  const packets = (() => {
    const out: { letters: string; digits: number[]; p: number; c: number; back: number }[] = [];
    for (let i = 0; i < nums.length; i += size) {
      const digits = nums.slice(i, i + size);
      const p = digits.reduce((acc, d) => acc * 27 + d, 0);
      const c = (p * K) % N;
      const back = kInv === null ? NaN : (c * kInv) % N;
      out.push({ letters: digits.map(toChar).join(""), digits, p, c, back });
    }
    return out;
  })();

  const pickSize = (s: number) => {
    setSize(s);
    setN(N_FOR[s][0]);
    setShow(null);
  };

  return (
    <div className="viz viz-cipher">
      <div className="cipher-controls">
        <label>
          Message
          <input className="mono expr-input" value={msg} onChange={(e) => setMsg(e.target.value.toUpperCase())} maxLength={12} spellCheck={false} />
        </label>
        <div className="viz-row viz-chips">
          <span className="chip-label">Packet size</span>
          {[1, 2, 3].map((s) => <button key={s} className={`chip ${s === size ? "is-on" : ""}`} onClick={() => pickSize(s)}>{s}</button>)}
        </div>
        <div className="viz-row viz-chips">
          <span className="chip-label">N</span>
          {N_FOR[size].map((n) => <button key={n} className={`chip chip-sm mono ${n === N ? "is-on" : ""}`} onClick={() => setN(n)}>{n}</button>)}
          <label className="cipher-k">
            K = <strong>{K}</strong>
            <input type="range" min={2} max={60} value={K} onChange={(e) => setK(+e.target.value)} />
          </label>
        </div>
      </div>

      <Stage>
      <div className="packets">
        {packets.map((pk, i) => (
          <button key={i} className={`packet ${show === i ? "is-open" : ""}`} onClick={() => setShow(show === i ? null : i)} style={{ animationDelay: `${i * 80}ms` }}>
            <span className="packet-letters mono">{pk.letters}</span>
            <span className="packet-stage mono">{pk.digits.join(" · ")}</span>
            <span className="packet-stage mono">p = {pk.p}</span>
            <span className="packet-c mono">c = {pk.c}</span>
          </button>
        ))}
      </div>

      {show !== null && (
        <div className="packet-detail mono pop" key={show}>
          <div>{packets[show].digits.map((d, k) => `${d}·27^${packets[show].digits.length - 1 - k}`).join(" + ")} = {packets[show].p}</div>
          <div>c = {packets[show].p} · {K} mod {N} = <strong>{packets[show].c}</strong></div>
          {kInv !== null && <div>decrypt: {packets[show].c} · {kInv} mod {N} = {packets[show].back} → {packets[show].letters}</div>}
        </div>
      )}

      <p className="viz-readout mono" aria-live="polite">
        ciphertext: <strong>{packets.map((p) => p.c).join(",")}</strong>
        <br />
        {kOk ? `K⁻¹ = ${kInv} (mod ${N}), since ${K}·${kInv} ≡ 1` : `gcd(${K}, ${N}) ≠ 1, so K has no inverse: messages can't be decrypted.`}
        {clean.length % size !== 0 ? ` · padded with "_" to fill the last packet` : ""}
      </p>
      </Stage>
    </div>
  );
}

export default split(PacketCipher);
