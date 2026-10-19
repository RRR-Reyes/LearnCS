import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { COURSES, sectionsOf } from "../courses";
import MathText from "./MathText";

/**
 * A test bench for the interactive visuals: every visual used by any course,
 * once each, drawn in place (split visuals show their stage right under their
 * controls). Open it at #/lab.
 */
export default function Lab() {
  const [courseId, setCourseId] = useState<string>("all");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const seen = new Set<unknown>();
    return COURSES.flatMap((course) =>
      course.units.flatMap((unit) =>
        sectionsOf(unit).flatMap((section) => {
          const V = section.Visual;
          if (!V || seen.has(V)) return [];
          seen.add(V);
          return [{ course, unit, section, V }];
        })
      )
    );
  }, []);

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    ({ course, unit, section }) =>
      (courseId === "all" || course.id === courseId) &&
      (!q || `${course.title} ${unit.title} ${section.title}`.toLowerCase().includes(q))
  );

  return (
    <div className="st lab" style={{ "--uh": 210, "--fade": 1 } as CSSProperties}>
      <header className="lab-head">
        <a href="#/" className="lab-back">← Home</a>
        <h1>Visual lab</h1>
        <p>Every interactive in one place, for testing. {shown.length} of {items.length} shown.</p>
        <div className="viz-row viz-chips">
          {[{ id: "all", title: "All" }, ...COURSES].map((c) => (
            <button key={c.id} className={`chip ${courseId === c.id ? "is-on" : ""}`} aria-pressed={courseId === c.id} onClick={() => setCourseId(c.id)}>
              {c.title}
            </button>
          ))}
          <input className="lab-search" type="search" placeholder="Filter by name" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </header>

      <main className="lab-list">
        {shown.map(({ course, unit, section, V }) => (
          <article key={`${course.id}/${unit.id}/${section.id}`} className="lab-card">
            <header>
              <h3>{section.title}</h3>
              <span>{course.title} · {unit.title}</span>
            </header>
            {section.visualHint && <p className="st-hint"><MathText text={section.visualHint} /></p>}
            <div className="lab-stage"><V /></div>
          </article>
        ))}
        {!shown.length && <p className="lab-empty">No visuals match.</p>}
      </main>
    </div>
  );
}
