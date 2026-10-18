import type { ComponentType } from "react";
import type { Icon } from "@phosphor-icons/react";

/** A quick multiple-choice check placed inside a unit's reading. */
export type Checkpoint = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

/** One block of a unit's left-column reading. */
export type Lesson = {
  heading: string;
  body: string;
  /** Optional check shown right after this block. */
  checkpoint?: Checkpoint;
};

/**
 * A section's thumbnail on the chapter intro tiles: a LaTeX formula, or an
 * open-source Phosphor icon drawn duotone in one of the chapter colors.
 */
export type Thumb =
  | { tex: string }
  | { icon: Icon; color: string };

/**
 * One concept in a scrolling chapter: its reading on the left, and the
 * visual that takes over the right column while it is on screen.
 */
export type Section = {
  id: string;
  title: string;
  thumb?: Thumb;
  /**
   * Paragraphs of reading, in order. \( … \) is inline LaTeX; a paragraph
   * that is only \[ … \] is a centered display formula.
   */
  body: string[];
  checkpoints?: Checkpoint[];
  Visual?: ComponentType;
  visualHint?: string;
};

export type Unit = {
  id: string;
  /** Short label, e.g. "Module 2" or "Ch. 9". */
  label: string;
  title: string;
  summary: string;
  /** Scrolling-chapter sections; units without them fall back to lessons. */
  sections?: Section[];
  lessons?: Lesson[];
  /** The interactive panel shown on the right (lesson-style units). */
  Visual?: ComponentType;
  /** Caption under the visual explaining how to use it. */
  visualHint?: string;
};

export type Course = {
  id: string;
  code?: string;
  title: string;
  term: string;
  tagline: string;
  /** Accent color; each unit gets a lighter tint of it. */
  hue: number;
  units: Unit[];
};
