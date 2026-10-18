import { useEffect, useRef } from "react";
import { COURSES, unitHue } from "../courses";
import { go } from "../useHashRoute";

type Props = { open: boolean; onClose: () => void; currentCourse?: string; currentUnit?: string };

export default function ChapterPicker({ open, onClose, currentCourse, currentUnit }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLButtonElement>(".picker-unit.is-current, .picker-unit")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const jump = (c: string, u?: string) => {
    go(c, u);
    onClose();
  };

  return (
    <div className="picker" role="dialog" aria-modal="true" aria-label="All chapters" onClick={onClose}>
      <div className="picker-panel" ref={panel} onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <button className="link-btn" onClick={() => jump("")}>← Home</button>
          <h2>All chapters</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="picker-courses">
          {COURSES.map((course) => (
            <section key={course.id} className="picker-course" style={{ ["--h" as string]: course.hue }}>
              <h3>
                <button className="link-btn" onClick={() => jump(course.id, course.units[0].id)}>{course.title}</button>
                <small>{course.term}</small>
              </h3>
              <div className="picker-units">
                {course.units.map((u, i) => {
                  const here = course.id === currentCourse && u.id === currentUnit;
                  return (
                    <button
                      key={u.id}
                      className={`picker-unit ${here ? "is-current" : ""}`}
                      style={{ ["--uh" as string]: unitHue(course, i), animationDelay: `${i * 22}ms` }}
                      onClick={() => jump(course.id, u.id)}
                      aria-current={here ? "page" : undefined}
                    >
                      <small>{u.label}</small>
                      {u.title}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
