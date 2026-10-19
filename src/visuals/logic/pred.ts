/**
 * Predicates over integers for the quantifier playground, such as
 * "x % 2 == 0" or "x + y = 0". A tiny parser instead of eval, so only
 * arithmetic, comparisons and and/or/not are allowed.
 */

type Val = number | boolean;
type Env = { x: number; y: number };
type Fn = (e: Env) => Val;

const ALIASES: [RegExp, string][] = [
  [/∧|&&|\band\b/g, "&"],
  [/∨|\|\||\bor\b/g, "|"],
  [/¬|\bnot\b/g, "!"],
  [/≠/g, "!="],
  [/≤/g, "<="],
  [/≥/g, ">="],
  [/\bmod\b/g, "%"],
  [/×/g, "*"],
  [/\^/g, "**"],
  [/²/g, "**2"],
  [/³/g, "**3"],
  [/−/g, "-"],
];

export class PredError extends Error {}

export function compile(src: string): { fn: Fn; usesY: boolean } {
  let s = src;
  for (const [re, to] of ALIASES) s = s.replace(re, to);
  const toks = s.match(/\*\*|==|!=|<=|>=|\d+|[xy]|[-+*/%()<>=!&|]|\S/g) ?? [];
  if (!toks.length) throw new PredError("Type a predicate, such as x % 2 == 0");
  let i = 0;
  const peek = () => toks[i];
  const take = (t?: string) => {
    if (t && toks[i] !== t) throw new PredError(`Expected "${t}"`);
    return toks[i++];
  };
  const num = (v: Val) => {
    if (typeof v !== "number") throw new PredError("Arithmetic needs numbers, not true/false");
    return v;
  };
  const bool = (v: Val) => {
    if (typeof v !== "boolean") throw new PredError("and, or and not need comparisons on both sides");
    return v;
  };

  const or = (): Fn => {
    let l = and();
    while (peek() === "|") {
      take();
      const a = l, b = and();
      l = (e) => bool(a(e)) || bool(b(e));
    }
    return l;
  };
  const and = (): Fn => {
    let l = notF();
    while (peek() === "&") {
      take();
      const a = l, b = notF();
      l = (e) => bool(a(e)) && bool(b(e));
    }
    return l;
  };
  const notF = (): Fn => {
    if (peek() === "!") {
      take();
      const a = notF();
      return (e) => !bool(a(e));
    }
    return cmp();
  };
  const CMP: Record<string, (a: number, b: number) => boolean> = {
    "==": (a, b) => a === b, "=": (a, b) => a === b, "!=": (a, b) => a !== b,
    "<": (a, b) => a < b, "<=": (a, b) => a <= b, ">": (a, b) => a > b, ">=": (a, b) => a >= b,
  };
  const cmp = (): Fn => {
    const l = add();
    const op = peek();
    if (op && CMP[op]) {
      take();
      const r = add();
      return (e) => CMP[op](num(l(e)), num(r(e)));
    }
    return l;
  };
  const add = (): Fn => {
    let l = mul();
    while (peek() === "+" || peek() === "-") {
      const op = take();
      const a = l, b = mul();
      l = op === "+" ? (e) => num(a(e)) + num(b(e)) : (e) => num(a(e)) - num(b(e));
    }
    return l;
  };
  const mul = (): Fn => {
    let l = pow();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = take();
      const a = l, b = pow();
      l =
        op === "*" ? (e) => num(a(e)) * num(b(e))
        : op === "/" ? (e) => num(a(e)) / num(b(e))
        // Math-style mod: never negative, so -3 % 2 is 1.
        : (e) => ((num(a(e)) % num(b(e))) + num(b(e))) % num(b(e));
    }
    return l;
  };
  const pow = (): Fn => {
    const base = unary();
    if (peek() === "**") {
      take();
      const ex = pow();
      return (e) => num(base(e)) ** num(ex(e));
    }
    return base;
  };
  const unary = (): Fn => {
    if (peek() === "-") {
      take();
      const a = unary();
      return (e) => -num(a(e));
    }
    return atom();
  };
  const atom = (): Fn => {
    const t = take();
    if (t === undefined) throw new PredError("Something is missing at the end");
    if (/^\d+$/.test(t)) {
      const v = Number(t);
      return () => v;
    }
    if (t === "x") return (e) => e.x;
    if (t === "y") return (e) => e.y;
    if (t === "(") {
      const inner = or();
      take(")");
      return inner;
    }
    throw new PredError(`"${t}" isn't allowed here. Use x, y, numbers, + − × / % ** and comparisons.`);
  };

  const fn = or();
  if (i < toks.length) throw new PredError(`Unexpected "${toks[i]}"`);
  return { fn, usesY: toks.includes("y") };
}

/** Compile and check it really answers true/false. */
export function tryCompile(src: string): { test: ((x: number, y: number) => boolean) | null; usesY: boolean; error: string | null } {
  try {
    const { fn, usesY } = compile(src);
    const probe = fn({ x: 1, y: 1 });
    if (typeof probe !== "boolean") throw new PredError("A predicate has to compare something, such as x > 2");
    return { test: (x, y) => fn({ x, y }) === true, usesY, error: null };
  } catch (e) {
    return { test: null, usesY: false, error: e instanceof Error ? e.message : String(e) };
  }
}
