import { useEffect, useRef, useState } from "react";

const MOVES = ["hop", "wave", "look", "wiggle", "shimmy"] as const;
type Move = (typeof MOVES)[number];

/**
 * A little pixel crab-thing that fidgets at random. Its body takes the
 * color you pass in; click it to make it do something right now.
 */
export default function Clawd({ color }: { color: string }) {
  const [move, setMove] = useState<{ name: Move; n: number } | null>(null);
  const last = useRef<Move | null>(null);

  const play = () => {
    const pool = MOVES.filter((m) => m !== last.current);
    const name = pool[Math.floor(Math.random() * pool.length)];
    last.current = name;
    setMove((m) => ({ name, n: (m?.n ?? 0) + 1 }));
  };

  useEffect(() => {
    let t: number;
    const loop = () => {
      play();
      t = window.setTimeout(loop, 1800 + Math.random() * 1800);
    };
    t = window.setTimeout(loop, 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <svg
      key={move ? `${move.name}-${move.n}` : "idle"}
      className={`clawd ${move ? `is-${move.name}` : ""}`}
      viewBox="0 0 120 104"
      role="img"
      aria-label="Clawd, wearing the chosen color"
      onClick={play}
      style={{ "--body": color } as React.CSSProperties}
    >
      <ellipse className="cl-shadow" cx="60" cy="98" rx="38" ry="5" />
      <g className="cl-all">
        <g className="cl-limbs">
          <rect className="cl-arm cl-arm-l" x="8" y="40" width="14" height="20" />
          <rect className="cl-arm cl-arm-r" x="98" y="40" width="14" height="20" />
          <rect className="cl-leg cl-leg-a" x="30" y="68" width="10" height="24" />
          <rect className="cl-leg cl-leg-b" x="44" y="68" width="10" height="24" />
          <rect className="cl-leg cl-leg-b" x="66" y="68" width="10" height="24" />
          <rect className="cl-leg cl-leg-a" x="80" y="68" width="10" height="24" />
        </g>
        <rect className="cl-body" x="20" y="18" width="80" height="54" />
        <rect className="cl-belly" x="20" y="58" width="80" height="14" />
        <g className="cl-eyes">
          <rect className="cl-eye" x="36" y="36" width="10" height="16" />
          <rect className="cl-eye" x="74" y="36" width="10" height="16" />
        </g>
      </g>
    </svg>
  );
}
