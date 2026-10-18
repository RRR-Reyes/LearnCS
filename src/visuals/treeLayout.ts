/** A binary tree node addressed by its heap-style index (root 0, children 2i+1 / 2i+2). */
export type Placed = { i: number; x: number; y: number; depth: number };

/** Positions for every index in a complete layout of the given depth. */
export function layoutBinary(indices: number[], width = 400, levelGap = 54, top = 28): Placed[] {
  return indices.map((i) => {
    const depth = Math.floor(Math.log2(i + 1));
    const pos = i - (2 ** depth - 1);
    const slots = 2 ** depth;
    return { i, depth, x: ((pos + 0.5) / slots) * width, y: top + depth * levelGap };
  });
}

export const parent = (i: number) => Math.floor((i - 1) / 2);
