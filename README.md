# LearnCS

Computer science you can see. Each unit is one long Seeing Theory–style chapter: the
reading scrolls on the left, and each concept's interactive visual takes over a fixed
right column as you reach it. A few quick multiple-choice checks sit in the reading.

Started as a copy of [ReviewApp](https://github.com/RRR-Reyes/ReviewApp), keeping the
chapter engine and visuals and leaving the question banks and practice drawer behind.

## Run

```bash
npm install
npm start        # http://localhost:3000/LearnCS
```

## Where things live

- `src/courses/`: course and unit data. `discrete.ts` is the full scrolling-chapter shape
  (sections with reading, `\( … \)` LaTeX, checks, a visual and a tile thumbnail);
  `data.ts` and `system.ts` still use the lighter one-visual-per-unit lesson shape.
- `src/visuals/`: one component per visual. Wrap the display part of a visual in
  `<Stage>` and export it with `split(...)` to keep its controls in the reading and draw
  only the display on the right (see `ExpectedDie.tsx`).
- `src/components/CoursePage.tsx`: the chapter page; `src/useActiveSection.ts`: which
  section owns the right column as you scroll.

Layout and mechanics inspired by [Seeing Theory](https://seeing-theory.brown.edu/)
(Brown University, Apache-2.0). Icons: [Phosphor](https://phosphoricons.com/) (MIT).
Math: [KaTeX](https://katex.org/) (MIT). Font: Assistant (OFL).
