# System Architecture

## High-level
Single-page static site. No backend. Phaser 3 runs the game loop inside a `<canvas>` element. Progress persists in `localStorage`.

```
 index.html ──▶ src/main.js ──▶ src/game/main.js (Phaser Game)
                                    │
                                    ├── MenuScene
                                    ├── LevelScene   ── registry: currentLevel
                                    └── GameScene
                                         │
                                         ├── parseLevel(XSB)  ── core/level-parser.js
                                         ├── BoardModel       ── core/board-model.js
                                         ├── BoardRenderer    ── ui/board-renderer.js
                                         └── progressStore    ── core/progress-store.js
                                                                     │
                                                                     └── localStorage
```

## Scene lifecycle
1. **MenuScene** — title, play, progress, hints.
2. **LevelScene** — paginated 5×4 grid, reads completion/best-moves from `progressStore`. On click: writes `currentLevel` to the Phaser registry and starts `GameScene`.
3. **GameScene** — `init` resets local state → `create` parses the level, builds `BoardModel`, instantiates `BoardRenderer`, wires input, builds HUD. `update()` handles key polling with a repeat gate (`KEY_REPEAT_MS = 130`).

## Input → state → render
```
key event ─▶ GameScene.update ─▶ BoardModel.tryMove(dx,dy)
                                    │
                                    └── returns true on legal move
                                         │
                                         ├── renderer.animateMove()
                                         ├── moveLabel.setText()
                                         └── if BoardModel.isSolved()
                                              └── onWin() ─▶ progressStore.recordCompletion()
```

## Level data
- Stored as XSB strings in `src/game/data/microban-levels.js`.
- XSB symbols: `#` wall, ` ` floor, `.` target, `$` box, `*` box-on-target, `@` player, `+` player-on-target.
- Parser flood-fills from the player position to compute the interior floor set. Everything outside the flood is treated as exterior (not rendered, not walkable).

## Persistence schema
`localStorage['sokoban-progress-v1']`:
```json
{
  "completed": { "0": true, "3": true, ... },
  "bestMoves": { "0": 14,   "3": 27,   ... }
}
```
Keys are level indices (0-based). `getCompletedCount()` returns the size of `completed`.

## Responsive rendering
`computeTileSize(levelW, levelH, viewportW, viewportH)` picks the largest tile size (capped at 64px) that fits the level with margin, so small puzzles display large and the two huge Microban levels (#154, #155 — not shipped) would still fit.

## Deployment
Static build via `vite build --config vite/config.prod.mjs`, output pushed to GitHub Pages via the repo's CI. No server-side components.
