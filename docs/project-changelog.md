# Project Changelog

## 2026-04-11 — Full Microban set

### Changed
- Level data expanded from the first 100 Microban puzzles to the complete 155-level set, including the oversized finale mazes ("Take the long way home", "The Dungeon"). Credit language updated everywhere to match.

## 2026-04-11 — Overhaul

### Added
- **100 Microban levels** (David W. Skinner) as the new stock level set, replacing the 3 hand-crafted puzzles. Stored as XSB text in `src/game/data/microban-levels.js`.
- **XSB level parser** (`core/level-parser.js`) with flood-fill floor detection.
- **BoardModel** (`core/board-model.js`) — pure state, undo history, win detection.
- **Progress store** (`core/progress-store.js`) — localStorage persistence of completion + best move count, fails gracefully if unavailable.
- **BoardRenderer** (`ui/board-renderer.js`) — floor/wall/target/box/player drawing with animated moves.
- **Button factory** (`ui/button-factory.js`) — one rounded-button implementation shared by every scene.
- **Nord theme** (`core/theme.js`) — palette, fonts, and responsive tile-size helper.
- **Paginated level select**: 5×4 grid × 5 pages, shows ✓ + best move count per completed level.
- **WASD controls**, **U/Z undo**, **R restart**, **Esc to menu**, move counter, win overlay with NEXT / LEVELS buttons.
- `docs/` — PDR, codebase summary, code standards, system architecture, roadmap, this changelog.

### Changed
- Scenes renamed to kebab-case (`menu-scene.js`, `level-scene.js`, `game-scene.js`) and rebuilt against the new core/ui modules.
- `main.js` now imports a shared theme and registers only the three new scenes.
- `public/style.css` now uses a radial gradient background and rounds the game container.
- `index.html` title updated.

### Removed
- `MenuScene.js`, `LevelScene.js`, `MainScene.js` (old PascalCase versions).
- `public/assets/levels/level1.json`, `level2.json`, `level3.json`.
- Arcade Physics setup inside `MainScene` — it was configured but never actually drove movement (moves were all tween-based on a grid). Colliders, `physics.world.shutdown()` call, and the hand-rolled `shutdown/destroy` lifecycle overrides are gone.
- Unused `import game from '../main.js'` in the old `MainScene`.
- Hardcoded `totalLevels: 3` and 3-element `levelCompleted` array in the game registry — replaced with dynamic lookup via `progressStore`.

### Fixed
- Scene restart no longer leaves dangling event listeners (Phaser handles this itself; the previous manual `removeAllListeners` was both redundant and fragile).
- Level select now scales to 100 puzzles via pagination instead of a single-row layout.
