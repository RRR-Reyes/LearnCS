# System Architecture: does each visual match its reading?

_Audit of 2026-10-18. Checked every section in `src/courses/system.ts` against its visual, and against
the course's question bank in ReviewApp (`src/modules/system/questions.ts`, Modules 1–5)._

Legend: ✅ matches · ⚠️ partly · ❌ not shown

## Module 1: Number Systems (one BitFlipper shared by all three sections)

| Section | Verdict | What's off |
|---|---|---|
| Positional notation | ⚠️ | Weights and hex are shown, but nothing shows *why* 4 bits = 1 hex digit (no nibble grouping). The full tool, including Negate and overflow, appears before those ideas are taught. |
| Two's complement | ✅ | −2⁷ label, signed readout and Negate (invert + 1) all match. |
| Extension and overflow | ⚠️ | Overflow is shown (±1 wraps and flashes). **Sign and zero extension are not shown at all**, but the bank has questions on both. |

**Fix:** convert to sections and stage the tool, the same way as Module 3:
1. Positional: unsigned only, with nibble brackets that each turn into a hex digit (like the color tool).
2. Two's complement: add the signed readout and Negate.
3. Extension and overflow: add a "widen 4 → 8 bits" control. The sign bit copies left for sign extension, and 0s fill in for zero extension. Keep ±1 for overflow.

## Module 2: Data Representation

| Section | Verdict | What's off |
|---|---|---|
| Encodings | ⚠️ | The text covers ASCII and RGB, but the tool only covers RGB. **ASCII isn't shown**, and the bank has ASCII encode/decode questions. |
| Error detection | ✅ | Hamming(7,4) matches. The bank also has a **Luhn checksum**, which neither the text nor the tool mentions. |
| Information and floats | ⚠️ | The float explorer covers the floats half. **The information half (log₂ N bits, entropy, minimum yes/no questions) has no visual.** |

**Fix:**
- Split Encodings into "Text (ASCII)" and "Color (RGB)". The ASCII tool: type a character to see its 7-bit code, then flip bit 5 to toggle 'A' ↔ 'a' (they are 32 apart).
- Split the last section. "Information" gets a twenty-questions game: pick 1 of N, and each yes/no halves the range until log₂ N questions are used. "Special float values" keeps the explorer.
- Optional: a short Luhn section after Hamming. It shows doubling every second digit, summing, and checking mod 10.

## Module 3: MIPS Instructions

| Section | Verdict | What's off |
|---|---|---|
| Logic: and, or | ✅ | |
| Exclusive or and not | ✅ | The bank also asks **nand**. MIPS has no nand instruction, so it could be mentioned as "and, then nor with $zero". |
| Shifting left / right | ✅ | |
| Multiply, divide and branch | ⚠️ | The HI/LO machine covers mult/div. **Branching isn't shown** (comparing registers, offset relative to PC+4), and neither are mfhi/mflo. |
| Floating-point fields | ⚠️ | The builder matches the text. The bank uses **7-bit fractions and a 10-bit mantissa** (half precision), but the builder is 32-bit only. |
| _(missing)_ | ❌ | The bank has **machine instruction decoding**: hex → R-type fields (op, rs, rt, rd, shamt, funct) → assembly. It also has lw/sw/slt/addi. No section covers these. |

**Fix:**
- Split "Branch" into its own section with a small PC-and-offset visual: beq/bne/slt, an arrow from PC+4 to the target, and taken vs not taken.
- Add mfhi/mflo lines to the HI/LO machine.
- Add a 16-bit (10-bit mantissa) toggle to the float builder.
- New section "Instruction encoding": type or pick a hex word. It splits into the colored 6/5/5/5/5/6 fields, maps the register numbers to names, and shows the assembly line.

## Module 4: MIPS Program Simulation (one MipsStepper shared by both sections)

| Section | Verdict | What's off |
|---|---|---|
| Tracing a program | ✅ | The loop program, register flashes and memory all match. |
| Subroutines | ❌ | The text is about jal, jr $ra and saving $ra on the stack. **The stepper's program has no jal, jr, $ra or stack.** |

**Fix:** convert to sections and give the stepper a second program for Subroutines: `jal`, then a routine that pushes $ra, calls another, pops and returns. The visual shows $ra, $sp and a small stack column. This also covers the bank's "jal / jr / bgt" programs (Modules 4 and 5).

## Module 5: C to Assembly & Memory (one ArrayAddress shared by both sections)

| Section | Verdict | What's off |
|---|---|---|
| Addressing arrays | ✅ | Row- and column-major address math matches. |
| From C to MIPS | ❌ | The text describes A[i] → shift, add base, lw. **The tool shows no MIPS.** |

**Fix:** convert to sections. For "From C to MIPS", show the generated code next to the clicked cell, with live values: `sll $t0, $i, 2`, `add $t0, $t0, $base`, `lw $t1, 0($t0)`. For 2D, add the `i × cols + j` step.

## Status (2026-10-18, after the fixes)

Everything above is done except the optional **Luhn checksum** section. Every System Architecture section now has its own visual:
- Module 1 is staged: unsigned with nibble → hex, then signed with Negate, then sign/zero extension and ±1 overflow.
- Module 2 split into ASCII, RGB, Hamming, Information (halving game) and Special float values.
- Module 3 split into Multiply and divide (now with mfhi/mflo), Branches and Instruction encoding. The float builder has a 16-bit option, and nand is mentioned.
- Module 4 Subroutines has its own jal / jr / stack program.
- Module 5 From C to MIPS shows the generated code with live register values.

## Suggested order (original)

1. Module 4 Subroutines and Module 5 C→MIPS: the text and visual don't match at all.
2. Module 3 instruction decoding: a whole topic from the bank is missing.
3. Module 2 ASCII and information splits.
4. Module 1 staging plus extension.
5. Smaller extras: branch visual, mfhi/mflo, the 16-bit builder, Luhn, nand.
