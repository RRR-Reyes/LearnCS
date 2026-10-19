# Handoff: LearnCS (Seeing Theory–style visual CS chapters)

_Last updated: 2026-10-18. Written for the next Claude session picking this up._

## The goal (in the owner's words, summarized)

LearnCS is a **visualization tool for students**, not a Q&A review site. It was split off
from the owner's personal ReviewApp (`C:\Users\User\IdeaProjects\ReviewApp`) so ReviewApp
keeps its question banks while LearnCS goes visual-first.

The model is **Seeing Theory** (https://seeing-theory.brown.edu). A local copy of its source
is at `C:\Users\User\IdeaProjects\seeing-theory`; the mechanics are in `js/chapter.js` and the
layout in `css/chapter-style.css`:

- One long scroll per unit. The left 40% is a tinted reading column that scrolls.
- The right 60% is **fixed to the window and never moves**. Each concept's visual lives
  there; scrolling only switches which one is visible.
- The intro shows section tiles (number, title, small clipart) on the right.
- Copy the **design and mechanics**, not Seeing Theory's text.

Owner feedback so far:
- "I like how it is right now, I wanna pivot into something more visual rather than Q&A."
- They dislike rounded, bubbly fonts and pills. They want **sharp** corners and the
  Assistant font (Seeing Theory's), including inside visuals and the check cards.
- They want LaTeX for math and open-source clipart for the tile thumbnails.
- They chose "visual-only + quick checks": inline multiple-choice checks stay, but there are
  no question banks, review bell or practice drawer.

## Repo state

- Folder: `C:\Users\User\IdeaProjects\LearnCS`, a fresh git repo on `main`, **no remote, nothing pushed**.
- **One commit**: "Start LearnCS: Seeing Theory-style visual chapters".
- **Uncommitted work (owner is reviewing it, so don't commit unprompted):** every Discrete
  visual split (see below), the new Venn in `CardinalityLab.tsx`, `src/visuals/Stage.tsx`
  tweak (`stage viz` class), and about 40 lines appended to `src/styles.css` plus the
  `.g-node` fix. This `HANDOFF.md` is also untracked.
- Commit messages must end with the attribution line from the session's system reminder.
- `node_modules` was copied from ReviewApp, so `npm start` works as is.
- `package.json` name is `learncs` and `homepage` is `https://rrr-reyes.github.io/LearnCS`
  (no GitHub repo exists yet).
- **Don't touch ReviewApp.** It has the owner's uncommitted edits and a tracked `build/`
  folder. The `.claude/launch.json` that starts LearnCS's dev server lives in ReviewApp's
  untracked `.claude/` folder.

## Architecture

- `src/courses/`
  - `types.ts`: `Course`, `Unit`, `Section`, `Lesson`, `Checkpoint`, `Thumb`.
  - `index.ts`: `COURSES` (Discrete, Data Structures, Systems), `unitHue`, and `sectionsOf(unit)`,
    which turns old-style `lessons` units into one section per lesson.
  - `discrete.ts`: **6 units, 18 sections**: full scrolling-chapter shape. Each section has
    `title`, `thumb`, `body: string[]`, `checkpoints`, `Visual`, `visualHint`.
  - `data.ts` and `system.ts`: still the older shape (`lessons` plus **one whole-unit
    `Visual`**, which is not split). The owner has not asked to convert these yet.
- `src/components/CoursePage.tsx`: the chapter. Fixed header with progress bar, `.st-left`
  reading column, `.st-right` fixed stage column, intro tiles with thumbnails, previous/next footer.
  At 960px or narrower, visuals render inline under each section and the right column is not rendered.
- `src/useActiveSection.ts`: the active section is the last one whose top crossed 45% of the
  viewport. It also returns reading progress and `fade` (the intro tint clears over the first
  45% of a screen of scroll). It measures synchronously on scroll, not with rAF.
- `src/visuals/Stage.tsx` (**the key mechanism**):
  - `<Stage>` portals its children into the active section's slot in the right column
    (via `StageTarget` context), or renders in place on narrow screens.
  - `split(Component)` marks a visual as split, so `CoursePage` renders it **inline in the
    reading** and lets it portal its `<Stage>` part to the right.
  - Convention: **controls** (chips, sliders, inputs, step buttons) stay outside `<Stage>`;
    **displays** (SVG, tables, readouts) go inside it.
  - A non-split visual (the Data Structures and Systems ones) is drawn whole on the right.
- `src/components/MathText.tsx`: KaTeX (MIT). `\( ... \)` is inline math, and a paragraph
  that is only `\[ ... \]` is a centered formula (handled by `Para` in `CoursePage`). Plain
  `$` is left alone because the text uses it for money. In `.ts` files write `\\(` and `\\[`.
- `Thumb` (in `types.ts`): either `{ tex }` (KaTeX) or `{ icon, color }` (a Phosphor duotone
  icon, MIT). Discrete sections have thumbnails; Data Structures and Systems do not yet.
- `src/components/CheckpointCard.tsx`: plain white card, 3px corners, square letter boxes, KaTeX in prompts.
- Styling: `src/styles.css` (one file). The Seeing Theory chapter styles are under
  `/* Seeing Theory–style chapter */`, `/* chapter: sharp type and controls */`, and
  `/* split visuals: the stage on the right */`. Inside `.st`, `--font` is Assistant and `--radius` is 3px.
- Fonts via `@fontsource` (Assistant 300/400/600/700, Nunito for the home page); KaTeX CSS
  is imported in `src/index.tsx`. Routing is hash-based (`#/discrete/sets`) in `useHashRoute.ts`.

### Split status

- **Split (18):** ExprTree, TruthTable, LogicLab, Venn3, CardinalityLab, SetRelations,
  CartesianGrid, FunctionClassify (+FunctionMap), CompositionMachine, InverseReflect,
  WellDefined, ModClock, PacketCipher, ExpectedDie, RngStepper, DiceStats, SequenceStairs, GraphBuilder.
- **Not split:** the Data Structures and Systems visuals (GrowthRates, StackQueue, TreeTraversal,
  HeapViz, HashTable, BSTViz, SortViz, DijkstraViz, BitFlipper, HammingCode, BitwiseOps,
  MipsStepper, ArrayAddress, VennSets).
- `CardinalityLab` got a **new live Venn diagram** on the stage (region counts and
  the current inclusion–exclusion term highlighted) that wasn't in the original.

## Verification done (2026-10-18)

- `npx tsc --noEmit -p . --skipLibCheck`: clean.
- Production build into a temp folder: compiles with no warnings (~177 kB JS gzip).
- Browser pane at 1440×860: all 18 Discrete sections show controls in the text and a
  non-empty display on the right, with no overflow and zero console errors. Flipping P in
  Truth Tables moves the highlighted row on the right. Switching units 5 times in a row is error-free.
- 375px: no horizontal scroll, and displays render inline.

## Commands

```bash
cd /c/Users/User/IdeaProjects/LearnCS
PORT=3005 BROWSER=none npm start       # http://localhost:3005/LearnCS/#/discrete/sets
BUILD_PATH="$HOME/AppData/Local/Temp/learncs-build" npx react-scripts build
npx tsc --noEmit -p . --skipLibCheck   # node_modules types are newer than TS 4.4, so skip lib checks
```

In the desktop app, the `learncs` entry in ReviewApp's `.claude/launch.json` runs the dev
server on port **3005** (port 3001 is taken by another process).

## Gotchas

- **Hash changes don't always re-render in the hidden browser pane.** After changing the
  hash, reload the page (or dispatch `new HashChangeEvent('hashchange')`), and after
  `scrollTo` dispatch `new Event('scroll')`. The pane also pauses animations when hidden, so
  screenshots can show rows or nodes mid-animation. Wait a second and look again.
- **Shell quoting eats backslashes and apostrophes.** There is no Python on this machine.
  For multi-line edits containing `\\(` LaTeX, use the Edit or Write tools or a `.js` file,
  not `node -e '...'` or heredocs with backslashes.
- A CSS `animation` that sets `transform` on an SVG `<g>` with a `transform=` attribute
  overrides the attribute and moves everything to the origin. That bug hid the graph
  vertices, and it's fixed by animating the circle instead.
- The ESLint config doesn't load `react-hooks`, so an `// eslint-disable-next-line react-hooks/...`
  comment fails the build. Restructure the code instead.
- `git` warns that LF will become CRLF. It's harmless.
- Old CSS from ReviewApp's pre-redesign chapter (`.chapter`, `.lesson`, `.viz-panel`,
  `.foot-link`, `.unit-chip`) is still in `styles.css` but unused.

## Suggested next steps (ask the owner what they want first)

1. **Owner is reviewing the chapters.** Wait for feedback, then fix what feels off. Likely
   areas: stage sizing and scale, how much sits in the text vs on the right, and whether the
   Cardinality diagram and tile thumbnails look right.
2. Commit the split work once the owner approves.
3. Home page: it still has the dark dot-field hero and rounded Nunito tiles from ReviewApp.
   It was never redesigned in Seeing Theory's style, and the owner said they like the chapter
   layout, so confirm before changing it.
4. Convert Data Structures and Systems to the full section shape (per-section
   visuals, thumbnails, split visuals), but only if the owner asks.
5. Create a GitHub repo, push, and set up GitHub Pages (the `homepage` field is already set).
6. Delete the dead CSS, and consider back-porting the `.g-node` fix to ReviewApp (it's a 3-line
   change there).
