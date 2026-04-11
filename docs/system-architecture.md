# System Architecture

## High-level
Single-page static site. No backend. Svelte 5 renders the UI and the game board; Vite bundles everything into a ~25 kB gzipped static site deployed to GitHub Pages. Progress persists in `localStorage`.

```
 index.html ──▶ src/main.js ──▶ App.svelte (router)
                                    │
                                    ├── MenuView
                                    ├── LevelSelectView
                                    └── GameView   ── keyed on levelIndex
                                         │
                                         ├── parseLevel(XSB)   ── lib/core/level-parser.js
                                         ├── new BoardModel(level) ── lib/core/board-model.js
                                         ├── Board.svelte      ── plain-prop DOM renderer
                                         └── progressStore     ── lib/core/progress-store.js
                                                                     │
                                                                     └── localStorage
```

## View routing
`App.svelte` holds two pieces of state: `view` (`'menu' | 'levels' | 'game'`) and `levelIndex`. It swaps view components with `{#if/else if/else}`. `GameView` is wrapped in `{#key levelIndex}` so changing the level unmounts and remounts the component with fresh state — no manual reset logic needed.

## Reactivity model in GameView
- `model` is a **non-reactive** reference to a `BoardModel` instance. It's mutated internally by `tryMove` / `undo` and reassigned on `restart`.
- `player`, `boxes`, `moves`, `won`, `parseError`, `tileSize` are **reactive** (`$state`). Every move ends with `syncFromModel()` which reassigns them from the current model state.
- `best` and `hasNext` are `$derived` from `levelIndex`.
- `Board` receives only plain props — it has no awareness of the model class, which keeps reactivity predictable and Board fully presentational.

Why this split? A class instance doesn't play nicely with Svelte 5's `$state` deep-proxy semantics when methods mutate `this` internally. Driving re-renders through explicit snapshot reassignments is clearer, easier to debug, and keeps the core modules framework-agnostic.

## Input → state → render
```
keydown ─▶ GameView.onKey (repeat-gated at 130ms)
                │
                ├── Escape → onLevels()
                ├── R      → restart() → new BoardModel(level) → syncFromModel()
                ├── U / Z  → undo() → model.undo() → syncFromModel()
                └── Arrow/WASD → tryMove(dx, dy) → model.tryMove() → syncFromModel()
                                                                │
                                                                └── if solved:
                                                                     ├── won = true
                                                                     └── progressStore.recordCompletion()
```

## Board rendering
`Board.svelte` is a single `<div class="board">` with absolutely-positioned children:

- **Floor** tiles and **walls** are rendered once from the Set props. Walls that don't border any floor tile are skipped so the dead outer border of the XSB grid doesn't render.
- **Targets** are drawn as circles with a `::after` pseudo-element, z-indexed behind boxes.
- **Boxes** and the **player** use `transform: translate(Xpx, Ypx)` with a 110 ms `transition: transform ease`. Moving them is a single style reassignment; the browser animates for free.
- A `--tile` CSS variable drives all sizing.

## Responsive sizing
`GameView.computeTileSize()` reads `window.innerWidth` / `innerHeight`, subtracts margins, divides by level dimensions, and clamps to `[16 px, 56 px]`. A `resize` listener updates `tileSize` live so the board re-layouts when the window changes.

## Persistence schema
`localStorage['sokoban-progress-v1']`:
```json
{
  "completed": { "0": true, "3": true, ... },
  "bestMoves": { "0": 14,   "3": 27,   ... }
}
```
Keys are 0-based level indices. Values are booleans / numbers. Wrapped in try/catch so private-mode browsers don't explode.

## Deployment
Static build via `vite build --config vite/config.prod.mjs`, base `/sokoban/`, output pushed to GitHub Pages. No server-side components. Bundle size ≈ **65 kB / 23 kB gzipped** — down from ~1.5 MB in the Phaser version.
