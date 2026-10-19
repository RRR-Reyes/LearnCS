import type { Course } from "./types";
import BitFlipper from "../visuals/BitFlipper";
import HammingCode from "../visuals/HammingCode";
import ColorTool from "../visuals/ColorTool";
import FloatExplorer from "../visuals/FloatExplorer";
import BitwiseOps from "../visuals/BitwiseOps";
import MipsStepper from "../visuals/MipsStepper";
import ArrayAddress from "../visuals/ArrayAddress";

export const system: Course = {
  id: "system",
  title: "System Architecture",
  term: "Spring 2026",
  tagline: "From bits and encodings up to MIPS programs and memory.",
  hue: 196,
  units: [
    {
      id: "numbers",
      label: "Module 1",
      title: "Number Systems",
      summary: "Binary, hex, and how the same bits mean different numbers.",
      Visual: BitFlipper,
      visualHint: "Click bits to flip them. Press +1 at the top of the range to watch overflow happen.",
      lessons: [
        {
          heading: "Positional notation",
          body: "Each bit is worth a power of two, so 1011₂ = 8 + 2 + 1 = 11. Hex groups four bits into one digit (0–F), which is why 1011 0010₂ = 0xB2.",
          checkpoint: {
            prompt: "What is 0x2F in decimal?",
            options: ["47", "32", "215", "45"],
            answer: 0,
            explanation: "2·16 + 15 = 47.",
          },
        },
        {
          heading: "Two's complement",
          body: "The top bit is worth −2ⁿ⁻¹ instead of +2ⁿ⁻¹. To negate, invert every bit and add 1. An n-bit signed range is −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1, one more negative than positive.",
          checkpoint: {
            prompt: "What does 1111 1110₂ mean as an 8-bit signed integer?",
            options: ["254", "−1", "−2", "−126"],
            answer: 2,
            explanation: "−128 + 126 = −2. Equivalently, invert to 0000 0001 and add 1 to get 2, so it's −2.",
          },
        },
        {
          heading: "Extension and overflow",
          body: "Sign extension copies the top bit leftward to widen a signed value; zero extension pads with 0s for unsigned values. Overflow happens when a result doesn't fit, like 127 + 1 in 8-bit signed wrapping to −128.",
        },
      ],
    },
    {
      id: "representation",
      label: "Module 2",
      title: "Data Representation",
      summary: "Encoding text, colors and floats, and catching transmission errors.",
      sections: [
        {
          id: "encodings",
          title: "Encodings",
          body: [
            "ASCII maps characters to 7-bit codes: 'A' is 65 and 'a' is 97, exactly 32 apart. RGB colors pack three 0–255 channels into six hex digits, so #FF8000 is full red, half green, no blue.",
            "Each channel is one byte, so eight bits, and a byte splits into two nibbles of four bits. Every nibble is exactly one hex digit.",
          ],
          Visual: ColorTool,
          visualHint: "Click or drag on the wheel to pick a color, then read each channel as a decimal, as bits, and as two hex digits.",
          checkpoints: [
            {
              prompt: "Which character is ASCII 0x42?",
              options: ["A", "B", "b", "*"],
              answer: 1,
              explanation: "0x42 = 66, one after 'A' (65).",
            },
          ],
        },
        {
          id: "error-detection",
          title: "Error detection",
          body: [
            "Hamming(7,4) adds parity bits at positions 1, 2 and 4. Each covers the positions whose index has that bit set. Reading the failed checks as a binary number gives the exact position of a single flipped bit.",
          ],
          Visual: HammingCode,
          visualHint: "Set the four data bits, then click any bit of the received word to corrupt it. Hover a parity check to see which positions it covers.",
          checkpoints: [
            {
              prompt: "Checks p1 and p4 fail and p2 passes. Which position is wrong?",
              options: ["3", "5", "6", "7"],
              answer: 1,
              explanation: "Failed checks add up: 1 + 4 = 5. Try corrupting position 5 in the panel.",
            },
          ],
        },
        {
          id: "information-floats",
          title: "Information and floats",
          body: [
            "Picking one of N equally likely outcomes takes log₂ N bits, the minimum number of yes/no questions.",
            "A float stores a number as a sign, an exponent and a mantissa: (−1)^sign × 1.mantissa × 2^(exponent − bias). IEEE 754 reserves an all-ones exponent for ∞ and NaN, and an all-zeros exponent for zero and denormals.",
          ],
          Visual: FloatExplorer,
          visualHint: "Flip any bit, or load a preset such as 0.1, ∞ or NaN, and watch the value rebuild itself.",
          checkpoints: [
            {
              prompt: "A float has an all-ones exponent and a mantissa of all zeros. What is it?",
              options: ["NaN", "Infinity", "Zero", "1.0"],
              answer: 1,
              explanation: "All-ones exponent means ∞ or NaN. A zero mantissa makes it ∞; a nonzero mantissa makes it NaN.",
            },
          ],
        },
      ],
    },
    {
      id: "mips",
      label: "Module 3",
      title: "MIPS Instructions",
      summary: "Floating-point fields, bitwise logic, shifts and single instructions.",
      Visual: BitwiseOps,
      visualHint: "Click bits in $t1 and $t2, then switch instructions. For shifts, drag the shift amount.",
      lessons: [
        {
          heading: "Logic and shifts",
          body: "and, or, xor and nor combine registers bit by bit. sll multiplies by a power of two. srl fills with zeros, while sra copies the sign bit so negative numbers stay negative.",
          checkpoint: {
            prompt: "In 8 bits, sra of 1000 0100 by 2 gives…",
            options: ["0010 0001", "1110 0001", "0001 0000", "1000 0001"],
            answer: 1,
            explanation: "sra shifts right and copies the sign bit (1) into the two vacated positions.",
          },
        },
        {
          heading: "Multiply, divide and branch",
          body: "mult and div leave results in HI and LO: the high and low halves of a product, or the remainder and quotient of a division. Branches compare registers and jump relative to the next instruction.",
          checkpoint: {
            prompt: "After div $t0, $t1 with 17 and 5, what is in HI?",
            options: ["3", "2", "17", "5"],
            answer: 1,
            explanation: "LO holds the quotient (3) and HI holds the remainder (2).",
          },
        },
        {
          heading: "Floating-point fields",
          body: "A float is sign, biased exponent and mantissa. Normalize the binary value to 1.xxx × 2ᵉ, store e + bias as the exponent, and keep only the bits after the leading 1.",
        },
      ],
    },
    {
      id: "simulation",
      label: "Module 4",
      title: "MIPS Program Simulation",
      summary: "Tracing registers and memory through loops and calls.",
      Visual: MipsStepper,
      visualHint: "Step one instruction at a time. Changed registers flash, and the pointer walks through memory.",
      lessons: [
        {
          heading: "Tracing a program",
          body: "Keep a table of registers and update one row per instruction. A loop is a backward branch, so count how many times its condition holds before it falls through.",
          checkpoint: {
            prompt: "In the panel's program, how many times does lw execute?",
            options: ["1", "3", "4", "5"],
            answer: 2,
            explanation: "The loop runs while $t1 < 4, so it runs for $t1 = 0, 1, 2, 3, loading four words.",
          },
        },
        {
          heading: "Subroutines",
          body: "jal saves the return address in $ra and jumps. jr $ra comes back. A routine that calls another must save $ra on the stack first, or it loses its way home.",
        },
      ],
    },
    {
      id: "memory",
      label: "Module 5",
      title: "C to Assembly & Memory",
      summary: "How arrays are laid out, and the address arithmetic behind A[i][j].",
      Visual: ArrayAddress,
      visualHint: "Click any cell. Switch between row- and column-major to see the memory order change.",
      lessons: [
        {
          heading: "Addressing arrays",
          body: "A 1D element lives at base + i × size. In row-major order (C), A[i][j] lives at base + (i × cols + j) × size. Column-major swaps the roles: base + (j × rows + i) × size.",
          checkpoint: {
            prompt: "int A[3][4] starts at 0x100. Where is A[2][1]? (row-major, 4-byte ints)",
            options: ["0x124", "0x118", "0x109", "0x130"],
            answer: 0,
            explanation: "(2·4 + 1)·4 = 36 = 0x24, and 0x100 + 0x24 = 0x124.",
          },
        },
        {
          heading: "From C to MIPS",
          body: "Compilers turn A[i] into a shift (multiply by 4 for words), an add to the base, then lw or sw. Loops become a compare, a branch and a pointer bump.",
        },
      ],
    },
  ],
};
