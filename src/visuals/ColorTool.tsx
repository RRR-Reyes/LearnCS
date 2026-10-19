import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import Clawd from "./Clawd";

const SIZE = 220;
const R = SIZE / 2;

/** HSV (h in degrees, s and v in 0..1) to 0..255 channels. */
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255)) as [number, number, number];
}

const CHANNELS = [
  { key: "R", name: "Red", color: "hsl(2 75% 52%)" },
  { key: "G", name: "Green", color: "hsl(140 55% 38%)" },
  { key: "B", name: "Blue", color: "hsl(212 80% 50%)" },
];

/**
 * Pick a color on the wheel and read it as three bytes: decimal, eight bits
 * grouped into two nibbles, and the two hex digits each nibble becomes.
 */
export default function ColorTool() {
  const [hue, setHue] = useState(30);
  const [sat, setSat] = useState(1);
  const [val, setVal] = useState(1);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x + 0.5 - R;
        const dy = y + 0.5 - R;
        const d = Math.hypot(dx, dy);
        const i = (y * SIZE + x) * 4;
        if (d > R) continue;
        const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const [r, g, b] = hsvToRgb(h, d / R, val);
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        // Soft 1px rim so the circle edge isn't jagged.
        img.data[i + 3] = Math.round(255 * Math.min(1, R - d));
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [val]);

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - box.left) / box.width) * SIZE - R;
    const dy = ((e.clientY - box.top) / box.height) * SIZE - R;
    setHue(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360);
    setSat(Math.min(1, Math.hypot(dx, dy) / R));
  };

  const rgb = hsvToRgb(hue, sat, val);
  const hex = rgb.map((c) => c.toString(16).toUpperCase().padStart(2, "0"));
  const css = `rgb(${rgb.join(",")})`;
  const angle = (hue * Math.PI) / 180;
  const markX = R + R * sat * Math.cos(angle);
  const markY = R + R * sat * Math.sin(angle);

  return (
    <div className="viz ct">
      <div className="ct-top">
        <div
          className="ct-wheel"
          style={{ width: SIZE, height: SIZE }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            pick(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && pick(e)}
          role="img"
          aria-label="Color wheel: click or drag to choose a color"
        >
          <canvas ref={canvas} width={SIZE} height={SIZE} />
          <span className="ct-marker" style={{ left: markX, top: markY, background: css }} />
        </div>

        <div className="ct-side">
          <Clawd color={css} />
          <label className="ct-slider">
            <span>Brightness</span>
            <input type="range" min={0} max={100} value={Math.round(val * 100)} onChange={(e) => setVal(+e.target.value / 100)} />
          </label>
          <div className="ct-code" aria-live="polite">
            #{hex.map((h, i) => (
              <span key={i} style={{ color: CHANNELS[i].color }}>{h}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="ct-table" role="table" aria-label="The color as three bytes">
        <div className="ct-head" role="row">
          <span />
          <span>Decimal</span>
          <span className="ct-places">
            {[128, 64, 32, 16, 8, 4, 2, 1].map((p, i) => (
              <i key={p} className={i === 4 ? "ct-gap" : ""}>{p}</i>
            ))}
          </span>
          <span>Hex</span>
        </div>
        {CHANNELS.map((ch, k) => {
          const bits = rgb[k].toString(2).padStart(8, "0").split("");
          return (
            <div key={ch.key} className="ct-row" role="row">
              <strong style={{ color: ch.color }} title={ch.name}>{ch.key}</strong>
              <span className="ct-dec">{rgb[k]}</span>
              <span className="ct-bits">
                {bits.map((b, i) => (
                  <i key={i} className={`${b === "1" ? "is-on" : ""} ${i === 4 ? "ct-gap" : ""}`} style={{ "--ch": ch.color } as React.CSSProperties}>
                    {b}
                  </i>
                ))}
              </span>
              <span className="ct-hex" style={{ color: ch.color }}>
                <small>{bits.slice(0, 4).join("")}→</small>{hex[k][0]}
                <small>{bits.slice(4).join("")}→</small>{hex[k][1]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="viz-readout">
        Three bytes = 24 bits = six hex digits: <strong>#{hex.join("")}</strong>
      </p>
    </div>
  );
}
