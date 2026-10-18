import { useEffect, useRef } from "react";
import { COURSES, sectionsOf, unitHue } from "../courses";
import type { Unit } from "../courses";
import { go } from "../useHashRoute";

/** Slowly drifting dots tinted with each course's hue; they part around the pointer. */
function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hues = COURSES.map((c) => c.hue);
    let w = 0;
    let h = 0;
    let raf = 0;
    const mouse = { x: -999, y: -999 };

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number };
    let dots: Dot[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 3 + Math.random() * 9,
        hue: hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 30,
        a: 0.35 + Math.random() * 0.5,
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110 && dist > 0) {
          d.vx += (dx / dist) * 0.06;
          d.vy += (dy / dist) * 0.06;
        }
        d.vx *= 0.985;
        d.vy *= 0.985;
        d.x = (d.x + d.vx + 0.04 + w) % w;
        d.y = (d.y + d.vy + h) % h;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue}, 70%, 62%, ${d.a})`;
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = e.clientX - box.left;
      mouse.y = e.clientY - box.top;
    };

    resize();
    frame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden />;
}

/** How many hands-on visuals a unit has, for its tile. */
function visualCount(u: Unit) {
  const n = new Set(sectionsOf(u).map((s) => s.Visual).filter(Boolean)).size;
  return n ? `${n} visual${n === 1 ? "" : "s"}` : "Reading";
}

export default function Home({ onOpenPicker }: { onOpenPicker: () => void }) {
  const units = COURSES.reduce((n, c) => n + c.units.length, 0);

  return (
    <div className="home">
      <section className="hero">
        <DotField />
        <nav className="hero-nav">
          <a className="brand" href="https://github.com/RRR-Reyes" target="_blank" rel="noreferrer">RRR-Reyes</a>
          <button className="link-btn" onClick={onOpenPicker}>All chapters</button>
        </nav>
        <div className="hero-copy">
          <h1>LearnCS</h1>
          <p>Computer science you can see: scroll through each idea and play with it.</p>
          <a className="btn btn-hero" href="#courses">Start</a>
        </div>
        <span className="hero-scroll" aria-hidden>↓</span>
      </section>

      <section id="courses" className="courses">
        <header className="courses-head">
          <h2>Courses</h2>
          <p>{COURSES.length} courses · {units} units · pick a unit to dive in</p>
        </header>

        {COURSES.map((course) => (
          <article key={course.id} className="course-row" style={{ ["--h" as string]: course.hue }}>
            <div className="course-row-head">
              <div>
                <span className="course-term">{course.term}</span>
                <h3>{course.title}</h3>
                <p>{course.tagline}</p>
              </div>
              <button className="btn btn-soft" onClick={() => go(course.id, course.units[0].id)}>
                Begin →
              </button>
            </div>
            <div className="unit-tiles">
              {course.units.map((u, i) => (
                <button
                  key={u.id}
                  className="unit-tile"
                  style={{ ["--uh" as string]: unitHue(course, i), animationDelay: `${i * 40}ms` }}
                  onClick={() => go(course.id, u.id)}
                >
                  <span className="unit-tile-label">{u.label}</span>
                  <strong>{u.title}</strong>
                  <span className="unit-tile-meta">{visualCount(u)}</span>
                </button>
              ))}
            </div>
          </article>
        ))}

        <footer className="home-foot">
          <p>
            Layout inspired by{" "}
            <a href="https://seeing-theory.brown.edu/" target="_blank" rel="noreferrer">Seeing Theory</a>{" "}
            (Brown University). Built with React.
          </p>
        </footer>
      </section>
    </div>
  );
}
