/**
 * A small propositional-logic engine: parse what a student types, evaluate
 * it, list its sub-expressions for a step-by-step truth table, and apply
 * one law at a time.
 */

export type Op = "∧" | "∨" | "⊕" | "→" | "↔" | "↑" | "↓";
export type Node =
  | { t: "var"; n: string }
  | { t: "const"; v: boolean }
  | { t: "not"; a: Node }
  | { t: "bin"; op: Op; a: Node; b: Node };

export class ParseError extends Error {
  constructor(message: string, public pos: number) {
    super(message);
  }
}

type Tok = { k: "var" | "const" | "op" | "not" | "(" | ")"; v: string; pos: number };

/** Typed spellings students reach for, mapped to the symbol they mean. */
const WORDS: [string, string][] = [
  ["<->", "↔"], ["<=>", "↔"], ["iff", "↔"], ["->", "→"], ["=>", "→"],
  ["/\\", "∧"], ["\\/", "∨"], ["nand", "↑"], ["nor", "↓"], ["xor", "⊕"],
  ["and", "∧"], ["or", "∨"], ["not", "¬"],
];
const SINGLE: Record<string, string> = {
  "¬": "¬", "~": "¬", "!": "¬", "∧": "∧", "&": "∧", "^": "∧", "*": "∧", "∨": "∨", "|": "∨", "+": "∨",
  "⊕": "⊕", "→": "→", "↔": "↔", "↑": "↑", "↓": "↓",
};

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  outer: while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    const lower = src.slice(i).toLowerCase();
    for (const [w, sym] of WORDS) {
      // Words must not run into a following letter ("order" is not "or").
      if (lower.startsWith(w) && !(/[a-z]/i.test(w[0]) && /[a-z]/i.test(src[i + w.length] ?? ""))) {
        toks.push({ k: sym === "¬" ? "not" : "op", v: sym, pos: i });
        i += w.length;
        continue outer;
      }
    }
    if (SINGLE[c]) {
      toks.push({ k: SINGLE[c] === "¬" ? "not" : "op", v: SINGLE[c], pos: i });
    } else if (c === "(" || c === ")") {
      toks.push({ k: c, v: c, pos: i });
    } else if (c === "T" || c === "t" || c === "1") {
      toks.push({ k: "const", v: "T", pos: i });
    } else if (c === "F" || c === "f" || c === "0") {
      toks.push({ k: "const", v: "F", pos: i });
    } else if (/[A-Za-z]/.test(c)) {
      toks.push({ k: "var", v: c.toUpperCase(), pos: i });
    } else {
      throw new ParseError(`"${c}" isn't a symbol I know`, i);
    }
    i++;
  }
  return toks;
}

/** Lowest to highest precedence. → groups to the right; the rest to the left. */
const LEVELS: Op[][] = [["↔"], ["→"], ["⊕"], ["∨", "↓"], ["∧", "↑"]];

export function parse(src: string): Node {
  const toks = tokenize(src);
  if (!toks.length) throw new ParseError("Type an expression", 0);
  let i = 0;
  const peek = () => toks[i];
  const end = () => (toks.length ? toks[toks.length - 1].pos + 1 : 0);

  const level = (l: number): Node => {
    if (l === LEVELS.length) return unary();
    let left = level(l + 1);
    while (peek()?.k === "op" && LEVELS[l].includes(peek().v as Op)) {
      const op = toks[i++].v as Op;
      const right = op === "→" ? level(l) : level(l + 1);
      left = { t: "bin", op, a: left, b: right };
      if (op === "→") break;
    }
    return left;
  };
  const unary = (): Node => {
    if (peek()?.k === "not") {
      i++;
      return { t: "not", a: unary() };
    }
    return atom();
  };
  const atom = (): Node => {
    const tk = peek();
    if (!tk) throw new ParseError("Something is missing at the end", end());
    i++;
    if (tk.k === "var") return { t: "var", n: tk.v };
    if (tk.k === "const") return { t: "const", v: tk.v === "T" };
    if (tk.k === "(") {
      const inner = level(0);
      if (peek()?.k !== ")") throw new ParseError("A ( is never closed", tk.pos);
      i++;
      return inner;
    }
    throw new ParseError(tk.k === ")" ? "This ) has no matching (" : `${tk.v} needs something on its left`, tk.pos);
  };

  const tree = level(0);
  if (i < toks.length) {
    const tk = toks[i];
    throw new ParseError(tk.k === ")" ? "This ) has no matching (" : `Expected an operator before "${tk.v}"`, tk.pos);
  }
  return tree;
}

export function evaluate(n: Node, env: Record<string, boolean>): boolean {
  switch (n.t) {
    case "var": return env[n.n];
    case "const": return n.v;
    case "not": return !evaluate(n.a, env);
    case "bin": {
      const a = evaluate(n.a, env);
      const b = evaluate(n.b, env);
      switch (n.op) {
        case "∧": return a && b;
        case "∨": return a || b;
        case "⊕": return a !== b;
        case "→": return !a || b;
        case "↔": return a === b;
        case "↑": return !(a && b);
        case "↓": return !(a || b);
      }
    }
  }
}

export function varsOf(n: Node, out = new Set<string>()): string[] {
  if (n.t === "var") out.add(n.n);
  if (n.t === "not") varsOf(n.a, out);
  if (n.t === "bin") { varsOf(n.a, out); varsOf(n.b, out); }
  return Array.from(out).sort();
}

const ASSOC: Op[] = ["∧", "∨", "⊕", "↔"];

/**
 * Print an expression. Mixed operators always get parentheses, even where
 * precedence would allow dropping them, because students read
 * "(P ∧ Q) ∨ R" more reliably than "P ∧ Q ∨ R". A chain of one associative
 * operator stays flat: P ∧ Q ∧ R.
 */
export function show(n: Node): string {
  if (n.t === "var") return n.n;
  if (n.t === "const") return n.v ? "T" : "F";
  if (n.t === "not") return "¬" + (n.a.t === "bin" ? `(${show(n.a)})` : show(n.a));
  const side = (c: Node) => {
    if (c.t !== "bin") return show(c);
    return c.op === n.op && ASSOC.includes(n.op) ? show(c) : `(${show(c)})`;
  };
  return `${side(n.a)} ${n.op} ${side(n.b)}`;
}

/** Every operator node, innermost first, without repeats: one table column each. */
export function steps(n: Node): Node[] {
  const seen = new Map<string, Node>();
  const walk = (x: Node) => {
    if (x.t === "not") walk(x.a);
    if (x.t === "bin") { walk(x.a); walk(x.b); }
    if (x.t === "not" || x.t === "bin") {
      const key = show(x);
      if (!seen.has(key)) seen.set(key, x);
    }
  };
  walk(n);
  return Array.from(seen.values());
}

/** Rows in textbook order: all-true first, all-false last. */
export const rowsFor = (vars: string[]) =>
  Array.from({ length: 2 ** vars.length }, (_, i) =>
    Object.fromEntries(vars.map((v, k) => [v, !((i >> (vars.length - 1 - k)) & 1)])) as Record<string, boolean>
  );

const not = (a: Node): Node => ({ t: "not", a });
const bin = (op: Op, a: Node, b: Node): Node => ({ t: "bin", op, a, b });

/** Rewrite →, ↔, ⊕, ↑ and ↓ using only ∧, ∨ and ¬ (same truth table). */
export function onlyAndOrNot(n: Node): Node {
  if (n.t === "var" || n.t === "const") return n;
  if (n.t === "not") return not(onlyAndOrNot(n.a));
  const a = onlyAndOrNot(n.a);
  const b = onlyAndOrNot(n.b);
  switch (n.op) {
    case "→": return bin("∨", not(a), b);
    case "↔": return bin("∨", bin("∧", a, b), bin("∧", not(a), not(b)));
    case "⊕": return bin("∨", bin("∧", a, not(b)), bin("∧", not(a), b));
    case "↑": return not(bin("∧", a, b));
    case "↓": return not(bin("∨", a, b));
    default: return bin(n.op, a, b);
  }
}

/**
 * Push the outermost ¬ that sits on a compound one step inward, naming
 * the law used. Returns null when every ¬ already sits on a variable.
 */
export function pushNot(n: Node): { node: Node; law: string } | null {
  if (n.t === "not") {
    const a = n.a;
    if (a.t === "not") return { node: a.a, law: "Double negation: ¬¬P ≡ P" };
    if (a.t === "const") return { node: { t: "const", v: !a.v }, law: "¬T ≡ F and ¬F ≡ T" };
    if (a.t === "bin") {
      const { op, a: x, b: y } = a;
      switch (op) {
        case "∧": return { node: bin("∨", not(x), not(y)), law: "De Morgan: ¬(P ∧ Q) ≡ ¬P ∨ ¬Q" };
        case "∨": return { node: bin("∧", not(x), not(y)), law: "De Morgan: ¬(P ∨ Q) ≡ ¬P ∧ ¬Q" };
        case "→": return { node: bin("∧", x, not(y)), law: "¬(P → Q) ≡ P ∧ ¬Q" };
        case "↔": return { node: bin("⊕", x, y), law: "¬(P ↔ Q) ≡ P ⊕ Q" };
        case "⊕": return { node: bin("↔", x, y), law: "¬(P ⊕ Q) ≡ P ↔ Q" };
        case "↑": return { node: bin("∧", x, y), law: "¬(P ↑ Q) ≡ P ∧ Q" };
        case "↓": return { node: bin("∨", x, y), law: "¬(P ↓ Q) ≡ P ∨ Q" };
      }
    }
    const inner = pushNot(a);
    return inner && { node: not(inner.node), law: inner.law };
  }
  if (n.t === "bin") {
    const l = pushNot(n.a);
    if (l) return { node: bin(n.op, l.node, n.b), law: l.law };
    const r = pushNot(n.b);
    if (r) return { node: bin(n.op, n.a, r.node), law: r.law };
  }
  return null;
}

/** Swap ∧ ↔ ∨ and T ↔ F. Only defined for ∧, ∨, ¬; returns null otherwise. */
export function dual(n: Node): Node | null {
  if (n.t === "var") return n;
  if (n.t === "const") return { t: "const", v: !n.v };
  if (n.t === "not") {
    const a = dual(n.a);
    return a && not(a);
  }
  if (n.op !== "∧" && n.op !== "∨") return null;
  const a = dual(n.a);
  const b = dual(n.b);
  return a && b && bin(n.op === "∧" ? "∨" : "∧", a, b);
}

export const negate = (n: Node): Node => not(n);

/** Parse without throwing, for live inputs. */
export function tryParse(src: string): { node: Node | null; error: ParseError | null } {
  try {
    return { node: parse(src), error: null };
  } catch (e) {
    return { node: null, error: e instanceof ParseError ? e : new ParseError(String(e), 0) };
  }
}
