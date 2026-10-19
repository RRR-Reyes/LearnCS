/** Positions 1..7; parity bits sit at the powers of two (1, 2, 4). */
export const PARITY = [1, 2, 4];
export const DATA_POS = [3, 5, 6, 7];
export const POSITIONS = [1, 2, 3, 4, 5, 6, 7];

/** Even-parity Hamming(7,4): each parity bit covers positions whose index has that bit set. */
export function encode(data: number[]) {
  const word = Array(8).fill(0);
  DATA_POS.forEach((p, i) => (word[p] = data[i]));
  for (const p of PARITY) {
    let x = 0;
    for (let i = 1; i <= 7; i++) if (i & p && i !== p) x ^= word[i];
    word[p] = x;
  }
  return word;
}

export const membersOf = (p: number) => POSITIONS.filter((i) => i & p);

export const syndromeOf = (word: number[]) =>
  PARITY.reduce((s, p) => {
    let x = 0;
    for (let i = 1; i <= 7; i++) if (i & p) x ^= word[i];
    return s + (x ? p : 0);
  }, 0);

export const labelOf = (pos: number) =>
  PARITY.includes(pos) ? `p${pos}` : `d${DATA_POS.indexOf(pos) + 1}`;
