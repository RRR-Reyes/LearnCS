import katex from "katex";
import type { ReactNode } from "react";

/** Renders one LaTeX expression; display mode centers it on its own line. */
export function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore" });
  return <span className={display ? "tex-display" : "tex"} dangerouslySetInnerHTML={{ __html: html }} />;
}

// \( … \) is inline math and \[ … \] is display math, as in LaTeX. Plain $ is
// left alone because the course text uses it for money.
const MATH = /\\\((.+?)\\\)|\\\[(.+?)\\\]/g;

/** Course text with optional LaTeX in it. */
export default function MathText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  Array.from(text.matchAll(MATH)).forEach((m) => {
    const at = m.index ?? 0;
    if (at > last) parts.push(text.slice(last, at));
    parts.push(<Tex key={at} tex={m[1] ?? m[2]} display={m[2] !== undefined} />);
    last = at + m[0].length;
  });
  if (last === 0) return <>{text}</>;
  parts.push(text.slice(last));
  return <>{parts}</>;
}
