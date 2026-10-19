import { useRef, useState } from "react";
import { tryParse } from "./prop";

/** Keypad keys: the symbol inserted, and a short name under it. */
const KEYS: { k: string; name?: string; ins?: string; wide?: boolean }[][] = [
  [{ k: "P" }, { k: "Q" }, { k: "R" }, { k: "S" }, { k: "T", name: "true" }, { k: "F", name: "false" }],
  [
    { k: "¬", name: "not" }, { k: "∧", name: "and", ins: " ∧ " }, { k: "∨", name: "or", ins: " ∨ " },
    { k: "⊕", name: "xor", ins: " ⊕ " }, { k: "→", name: "implies", ins: " → " }, { k: "↔", name: "iff", ins: " ↔ " },
  ],
  [
    { k: "↑", name: "nand", ins: " ↑ " }, { k: "↓", name: "nor", ins: " ↓ " }, { k: "(" }, { k: ")" },
    { k: "⌫", name: "delete" }, { k: "C", name: "clear" },
  ],
];

/** One editable expression: its text, its <input>, and a parse of it. */
export function useExpr(initial: string) {
  const [text, setText] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  return { text, setText, ref, ...tryParse(text) };
}
export type ExprState = ReturnType<typeof useExpr>;

/** Apply a keypad key to an expression at its caret. */
export function pressKey(expr: ExprState, key: string) {
  const el = expr.ref.current;
  const v = expr.text;
  const s = el?.selectionStart ?? v.length;
  const e = el?.selectionEnd ?? v.length;
  let next = v;
  let caret = s;
  if (key === "C") {
    next = "";
    caret = 0;
  } else if (key === "⌫") {
    if (s !== e) {
      next = v.slice(0, s) + v.slice(e);
    } else if (s > 0) {
      // Remove a padded operator (" ∧ ") in one press.
      const cut = / . $/.test(v.slice(Math.max(0, s - 3), s)) && v[s - 2] !== " " ? 3 : 1;
      next = v.slice(0, s - cut) + v.slice(s);
      caret = s - cut;
    }
  } else {
    const def = KEYS.flat().find((x) => x.k === key);
    const ins = def?.ins ?? key;
    next = v.slice(0, s) + ins + v.slice(e);
    caret = s + ins.length;
  }
  expr.setText(next);
  requestAnimationFrame(() => {
    el?.focus();
    el?.setSelectionRange(caret, caret);
  });
}

export function Keypad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <div className="lk-pad" role="group" aria-label="Logic symbols">
      {KEYS.flat().map((key) => (
        <button
          key={key.k}
          className={`lk-key ${/[PQRSTF]/.test(key.k) && key.k.length === 1 ? "is-var" : ""} ${key.k === "⌫" || key.k === "C" ? "is-edit" : ""}`}
          // Keep focus (and the caret) in the field while tapping keys.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onKey(key.k)}
          aria-label={key.name ?? key.k}
        >
          <strong>{key.k}</strong>
          {key.name && <small>{key.name}</small>}
        </button>
      ))}
    </div>
  );
}

/** The text field, with the parse error pointed at where it happened. */
export function ExprField({
  expr,
  label,
  active,
  onFocus,
}: {
  expr: ExprState;
  label?: string;
  active?: boolean;
  onFocus?: () => void;
}) {
  const err = expr.error;
  return (
    <div className={`lk-field ${label ? "" : "no-label"} ${active ? "is-active" : ""} ${err ? "has-error" : ""}`}>
      {label && <span className="lk-label">{label}</span>}
      <input
        ref={expr.ref}
        className="lk-input"
        value={expr.text}
        spellCheck={false}
        autoComplete="off"
        aria-label={label ? `Expression ${label}` : "Expression"}
        aria-invalid={!!err}
        onFocus={onFocus}
        onChange={(e) => expr.setText(e.target.value)}
      />
      {err && expr.text.trim() !== "" && (
        <span className="lk-error" role="status">
          <code>{expr.text.slice(0, err.pos)}<mark>{expr.text[err.pos] ?? " "}</mark>{expr.text.slice(err.pos + 1)}</code>
          {err.message}
        </span>
      )}
    </div>
  );
}
