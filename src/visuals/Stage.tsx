import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Where a split visual's display goes: the section's slot in the fixed right
 * column, or null to render in place (narrow screens).
 */
export const StageTarget = createContext<HTMLElement | null>(null);

/**
 * The display half of a split visual (chart, diagram). It is drawn in the
 * fixed right column while the visual's controls stay in the reading, the way
 * Seeing Theory keeps its die and buttons in the text and the plot on the right.
 */
export function Stage({ children }: { children: ReactNode }) {
  const target = useContext(StageTarget);
  return target ? createPortal(<div className="stage">{children}</div>, target) : <>{children}</>;
}

/** Marks a visual whose controls belong inline in the reading (it uses <Stage>). */
export function split<P>(Comp: ComponentType<P>) {
  return Object.assign(Comp, { split: true as const });
}

export const isSplit = (Comp?: ComponentType) => !!(Comp as { split?: boolean } | undefined)?.split;
