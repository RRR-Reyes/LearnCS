import type { Course } from "./types";
import { BitsPositional, BitsSigned, BitsExtend } from "../visuals/BitFlipper";
import HammingCode from "../visuals/HammingCode";
import ColorTool from "../visuals/ColorTool";
import AsciiTool from "../visuals/AsciiTool";
import InfoGame from "../visuals/InfoGame";
import FloatExplorer from "../visuals/FloatExplorer";
import HiLoMachine from "../visuals/HiLoMachine";
import FloatBuilder from "../visuals/FloatBuilder";
import BranchViz from "../visuals/BranchViz";
import InstrDecoder from "../visuals/InstrDecoder";
import { bitwiseStage } from "../visuals/BitwiseOps";
import MipsStepper, { CallStepper } from "../visuals/MipsStepper";
import ArrayAddress, { ArrayToMips } from "../visuals/ArrayAddress";

// Module 3 introduces one family of instructions at a time; each stage's tool offers everything so far.
const LogicAndOr = bitwiseStage(["and", "or"], ["and", "or"]);
const LogicXorNor = bitwiseStage(["and", "or", "xor", "nor"], ["xor", "nor"]);
const ShiftLeft = bitwiseStage(["and", "or", "xor", "nor", "sll"], ["sll"]);
const ShiftRight = bitwiseStage(["and", "or", "xor", "nor", "sll", "srl", "sra"], ["srl", "sra"]);

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
      sections: [
        {
          id: "positional",
          title: "Positional notation",
          body: [
            "Each bit is worth a power of two, so 1011₂ = 8 + 2 + 1 = 11.",
            "Hex groups four bits into one digit (0–F), because four bits hold exactly 16 values. That's why 1011 0010₂ = 0xB2: 1011 is B and 0010 is 2.",
          ],
          Visual: BitsPositional,
          visualHint: "Click bits to flip them, and watch each group of four turn into one hex digit.",
          checkpoints: [
            {
              prompt: "What is 0x2F in decimal?",
              options: ["47", "32", "215", "45"],
              answer: 0,
              explanation: "2·16 + 15 = 47.",
            },
          ],
        },
        {
          id: "twos-complement",
          title: "Two's complement",
          body: [
            "The top bit is worth −2ⁿ⁻¹ instead of +2ⁿ⁻¹. To negate, invert every bit and add 1. An n-bit signed range is −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1, one more negative than positive.",
          ],
          Visual: BitsSigned,
          visualHint: "The top bit now counts negative. Try Negate on a few values, and on −128.",
          checkpoints: [
            {
              prompt: "What does 1111 1110₂ mean as an 8-bit signed integer?",
              options: ["254", "−1", "−2", "−126"],
              answer: 2,
              explanation: "−128 + 126 = −2. Equivalently, invert to 0000 0001 and add 1 to get 2, so it's −2.",
            },
          ],
        },
        {
          id: "extension-overflow",
          title: "Extension and overflow",
          body: [
            "Sign extension copies the top bit leftward to widen a signed value; zero extension pads with 0s for unsigned values.",
            "Overflow happens when a result doesn't fit, like 127 + 1 in 8-bit signed wrapping to −128.",
          ],
          Visual: BitsExtend,
          visualHint: "Start with 4 bits and widen them both ways. Then press +1 at the top of the range to watch overflow happen.",
          checkpoints: [
            {
              prompt: "Sign-extend the 4-bit value 1010 to 8 bits.",
              options: ["0000 1010", "1111 1010", "1010 0000", "1000 1010"],
              answer: 1,
              explanation: "The sign bit is 1, so the four new bits are all 1: 1111 1010, still −6.",
            },
          ],
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
          id: "ascii",
          title: "Text: ASCII",
          body: [
            "ASCII gives every character a 7-bit code: 'A' is 65, 'a' is 97 and '0' is 48. Uppercase and lowercase are exactly 32 apart, so a single bit (the one worth 32) switches the case.",
          ],
          Visual: AsciiTool,
          visualHint: "Type a word and pick a letter. Flip its bits, or flip just the case bit, and watch the character change.",
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
          id: "rgb",
          title: "Color: RGB",
          body: [
            "RGB colors pack three 0–255 channels into six hex digits, so #FF8000 is full red, half green, no blue.",
            "Each channel is one byte, so eight bits, and a byte splits into two nibbles of four bits. Every nibble is exactly one hex digit.",
          ],
          Visual: ColorTool,
          visualHint: "Click or drag on the wheel to pick a color, then read each channel as a decimal, as bits, and as two hex digits.",
          checkpoints: [
            {
              prompt: "What color is #00FF00?",
              options: ["Red", "Green", "Blue", "Black"],
              answer: 1,
              explanation: "Red 00, green FF (255), blue 00: pure green.",
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
          id: "information",
          title: "Information",
          body: [
            "Picking one of N equally likely outcomes takes log₂ N bits: the minimum number of yes/no questions. Each good question halves what is left, and each answer is one bit.",
          ],
          Visual: InfoGame,
          visualHint: "Keep asking the halving question until one number is left, then compare the count with log₂ N.",
          checkpoints: [
            {
              prompt: "How many yes/no questions does it take to always find 1 of 64 equally likely items?",
              options: ["5", "6", "8", "32"],
              answer: 1,
              explanation: "log₂ 64 = 6: each question halves 64 → 32 → 16 → 8 → 4 → 2 → 1.",
            },
          ],
        },
        {
          id: "float-values",
          title: "Special float values",
          body: [
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
      sections: [
        {
          id: "and-or",
          title: "Logic: and, or",
          body: [
            "and and or combine two registers one bit at a time. and keeps a 1 only where both inputs have a 1; or keeps a 1 where either input does.",
          ],
          Visual: LogicAndOr,
          visualHint: "Click bits in $t1 and $t2, then switch between and and or.",
        },
        {
          id: "xor-nor",
          title: "Exclusive or and not",
          body: [
            "xor keeps a 1 only where the inputs differ, so xor of a register with itself clears it. MIPS has no not instruction: nor is 'or, then invert', so nor with $zero flips every bit.",
            "There is no nand either. To get it, and the two registers, then nor the result with $zero.",
          ],
          Visual: LogicXorNor,
          visualHint: "xor and nor have joined the row. Try nor with $t2 set to all zeros.",
        },
        {
          id: "shift-left",
          title: "Shifting left",
          body: [
            "sll slides every bit left by the shift amount and fills the right with zeros. Each step left multiplies by 2, so sll by 3 multiplies by 8. Bits pushed past the left edge are lost.",
          ],
          Visual: ShiftLeft,
          visualHint: "Drag the shift amount and watch the bits slide left.",
        },
        {
          id: "shift-right",
          title: "Shifting right",
          body: [
            "srl fills the vacated high bits with zeros, so it is right for unsigned numbers. sra copies the sign bit instead, so negative numbers stay negative.",
          ],
          Visual: ShiftRight,
          visualHint: "All seven instructions are here now. Compare srl and sra on a value with a leading 1.",
          checkpoints: [
            {
              prompt: "In 8 bits, sra of 1000 0100 by 2 gives…",
              options: ["0010 0001", "1110 0001", "0001 0000", "1000 0001"],
              answer: 1,
              explanation: "sra shifts right and copies the sign bit (1) into the two vacated positions.",
            },
          ],
        },
        {
          id: "mult-div",
          title: "Multiply and divide",
          body: [
            "mult and div write two special registers, HI and LO. mult splits the product: the high half goes in HI and the low half in LO. div puts the quotient in LO and the remainder in HI.",
            "Nothing reads HI or LO directly. mfhi and mflo copy them into ordinary registers.",
          ],
          Visual: HiLoMachine,
          visualHint: "Drag $t0 and $t1, then switch between mult and div to see HI and LO fill.",
          checkpoints: [
            {
              prompt: "After div $t0, $t1 with 17 and 5, what is in HI?",
              options: ["3", "2", "17", "5"],
              answer: 1,
              explanation: "LO holds the quotient (3) and HI holds the remainder (2).",
            },
          ],
        },
        {
          id: "branches",
          title: "Branches",
          body: [
            "beq jumps when two registers are equal, and bne jumps when they differ. Otherwise the program falls through to the next instruction.",
            "The offset counts instructions, not bytes, and it is measured from the instruction after the branch: next PC = PC + 4 + offset × 4. A negative offset jumps backward, which is how loops are built.",
          ],
          Visual: BranchViz,
          visualHint: "Change $t0, $t1 and the offset. The green line is what runs next.",
          checkpoints: [
            {
              prompt: "A beq at 0x400010 with offset −3 is taken. Where does it go?",
              options: ["0x400004", "0x400008", "0x40000c", "0x400014"],
              answer: 1,
              explanation: "PC + 4 = 0x400014, then −3 × 4 = −12: 0x400014 − 0xc = 0x400008.",
            },
          ],
        },
        {
          id: "encoding",
          title: "Instruction encoding",
          body: [
            "Every MIPS instruction is one 32-bit word. The top 6 bits, the opcode, decide how the rest is split.",
            "R-type (opcode 0) has three 5-bit register fields (rs, rt, rd), a 5-bit shift amount and a 6-bit funct that names the operation. I-type keeps rs and rt and uses the last 16 bits for a constant. J-type uses the last 26 bits for a jump address.",
          ],
          Visual: InstrDecoder,
          visualHint: "Type a hex word or pick one, then read each field. Random R-type gives one like the course's decoding questions.",
          checkpoints: [
            {
              prompt: "In an R-type word, which field names the destination register?",
              options: ["rs", "rt", "rd", "funct"],
              answer: 2,
              explanation: "rd is the destination; rs and rt are the sources (rt is the shifted register for shifts).",
            },
          ],
        },
        {
          id: "float-fields",
          title: "Floating-point fields",
          body: [
            "To store a number as a float, follow it through a few small steps. Take 10.5, which is 1010.1 in binary.",
            "First slide the point until exactly one 1 sits to its left: 1.0101 × 2³. The 3 is the exponent, and 0101 is everything after the point.",
            "The exponent is stored with the bias 127 added, so it never needs a sign of its own: 3 + 127 = 130, which is 1000 0010. The leading 1 is always there, so it is not stored. The mantissa keeps only the bits after it, padded with zeros.",
            "Sign 0, exponent 10000010, mantissa 0101 000…: that is 0x41280000.",
          ],
          Visual: FloatBuilder,
          visualHint: "Type a number or pick one, then follow the five steps from the number down to its 32 bits.",
          checkpoints: [
            {
              prompt: "With bias 127, which 8 exponent bits store 2⁻¹ (that is, e = −1)?",
              options: ["0111 1110", "1000 0000", "0111 1111", "1000 0001"],
              answer: 0,
              explanation: "Stored exponent = e + bias = −1 + 127 = 126, which is 0111 1110.",
            },
          ],
        },
      ],
    },
    {
      id: "simulation",
      label: "Module 4",
      title: "MIPS Program Simulation",
      summary: "Tracing registers and memory through loops and calls.",
      sections: [
        {
          id: "tracing",
          title: "Tracing a program",
          body: [
            "Keep a table of registers and update one row per instruction. A loop is a backward branch, so count how many times its condition holds before it falls through.",
          ],
          Visual: MipsStepper,
          visualHint: "Step one instruction at a time. Changed registers flash, and the pointer walks through memory.",
          checkpoints: [
            {
              prompt: "In the panel's program, how many times does lw execute?",
              options: ["1", "3", "4", "5"],
              answer: 2,
              explanation: "The loop runs while $t1 < 4, so it runs for $t1 = 0, 1, 2, 3, loading four words.",
            },
          ],
        },
        {
          id: "subroutines",
          title: "Subroutines",
          body: [
            "jal saves the return address (the instruction after the jal) in $ra and jumps. jr $ra jumps back to it.",
            "A routine that calls another must save $ra on the stack first: the inner jal overwrites $ra, so without the saved copy the outer routine loses its way home. Push with addi $sp, $sp, −4 and sw; pop with lw and addi $sp, $sp, 4.",
          ],
          Visual: CallStepper,
          visualHint: "Step through main → twice_plus_one → twice. Watch $ra change at each jal, and the old $ra wait on the stack.",
          checkpoints: [
            {
              prompt: "In the panel, what is in $ra right after jal twice runs?",
              options: ["0x400008", "0x40001c", "0x40002c", "0x7ff8"],
              answer: 1,
              explanation: "jal stores the address of the next instruction, addi $v0 at 0x40001c. The earlier 0x400008 is safe on the stack.",
            },
          ],
        },
      ],
    },
    {
      id: "memory",
      label: "Module 5",
      title: "C to Assembly & Memory",
      summary: "How arrays are laid out, and the address arithmetic behind A[i][j].",
      sections: [
        {
          id: "addressing",
          title: "Addressing arrays",
          body: [
            "A 1D element lives at base + i × size. In row-major order (C), A[i][j] lives at base + (i × cols + j) × size. Column-major swaps the roles: base + (j × rows + i) × size.",
          ],
          Visual: ArrayAddress,
          visualHint: "Click any cell. Switch between row- and column-major to see the memory order change.",
          checkpoints: [
            {
              prompt: "int A[3][4] starts at 0x100. Where is A[2][1]? (row-major, 4-byte ints)",
              options: ["0x124", "0x118", "0x109", "0x130"],
              answer: 0,
              explanation: "(2·4 + 1)·4 = 36 = 0x24, and 0x100 + 0x24 = 0x124.",
            },
          ],
        },
        {
          id: "c-to-mips",
          title: "From C to MIPS",
          body: [
            "A compiler turns A[i][j] into the same formula, one instruction at a time: multiply i by the row length, add j, scale by the element size (a shift when the size is a power of two, so sll by 2 for 4-byte words), add the base, then lw or sw.",
            "Loops over an array become a compare, a branch and a pointer bump, like the program in Module 4.",
          ],
          Visual: ArrayToMips,
          visualHint: "Click a cell and read the code that finds it. Change the element size to see the shift turn into a multiply.",
        },
      ],
    },
  ],
};
