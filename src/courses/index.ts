import type { Course, Section, Unit } from "./types";
import { discrete } from "./discrete";
import { system } from "./system";
import { data } from "./data";

/**
 * Every course the site shows, in display order.
 *
 * To add a course: put its question bank under src/modules/<course>/,
 * describe its units in src/courses/<course>.ts (see discrete.ts for the
 * typed-answer shape, data.ts for multiple choice), and add it here.
 */
export const COURSES: Course[] = [discrete, data, system];

export const findCourse = (id?: string) => COURSES.find((c) => c.id === id);

/** Soft background tint for a unit, stepping the course hue per unit. */
export const unitHue = (course: Course, index: number) =>
  (course.hue + (index - (course.units.length - 1) / 2) * 9 + 360) % 360;

/**
 * A unit's scrolling sections. Units still written as lessons (Systems,
 * Data Structures) become one section per lesson sharing the unit's visual.
 */
export const sectionsOf = (unit: Unit): Section[] =>
  unit.sections ??
  (unit.lessons ?? []).map((l, i) => ({
    id: `l${i}`,
    title: l.heading,
    body: [l.body],
    checkpoints: l.checkpoint ? [l.checkpoint] : undefined,
    Visual: unit.Visual,
    visualHint: unit.visualHint,
  }));

export type { Course, Unit, Lesson, Checkpoint, Section, Thumb } from "./types";
