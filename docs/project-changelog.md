# Project Changelog

## 2026-04-27 — Mobile Comfort & PWA

### Added
- **On-screen D-pad + action stack** (`MobileControls.svelte`, ~90 LOC): Hidden on desktop via `@media (pointer: coarse)`, visible on touch devices. D-pad bottom-right, actions (Undo/Restart/Levels) bottom-left. Tap-only, no auto-repeat.
- **Haptics module** (`lib/core/haptics.js`, ~13 LOC): Wraps `navigator.vibrate`. Pulses 10 ms on box push, 60 ms on win. Silent no-op where unsupported.
- **Safe-area insets:** MobileControls and Board respect `env(safe-area-inset-*)` for notch/Home-indicator safety on iPhone and Android.
- **Gesture blocking:** Board sets `touch-action: none` globally to block browser pull-to-refresh, double-tap zoom, and long-press selection.
- **PWA (Progressive Web App):** Full offline support via `vite-plugin-pwa`. Includes Web Manifest (standalone display, theme color #5e81ac), Workbox service worker (auto-update, asset caching), and adaptive icons (192/512/maskable PNG). Installable via "Add to Home Screen" on iOS/Android.

### Changed
- `GameView.svelte`: Now imports `pulse()` from haptics module; calls `pulse(10)` when a box moves, `pulse(60)` on level win.
- `Board.svelte`: Added global `touch-action: none` to prevent browser interference with touch interactions.
- `vite/config.prod.mjs`: Integrated `VitePWA` plugin with manifest, workbox caching, and icon definitions.

### Removed
- No breaking changes. Keyboard input, desktop layout, and win flow unchanged. Mobile features degrade gracefully on non-touch devices.

### Notes
- **Testing:** Manual smoke test on iOS Safari + Android Chrome confirmed D-pad reachable one-handed, browser quirks blocked, offline play works, installable.
- **Bundle impact:** PWA metadata adds ~2 kB; total bundle remains ≈ 65 kB JS / 23 kB gzipped.
- **Desktop regression:** Keyboard (arrows/WASD), undo (U/Z), restart (R), menu (Esc), move counter, win overlay all unchanged.

## 2026-04-12 — Svelte rewrite

### Changed
- **Replaced Phaser 3 with Svelte 5** as the rendering and UI layer. The game is now a static DOM app — native `<button>` elements, CSS grid board, `transform` animations with CSS transitions.
- Bundle shrinks from ~1.5 MB Phaser to **65 kB JS / 23 kB gzipped** (about 60× smaller).
- New layout: `src/App.svelte`, `src/views/*.svelte`, `src/lib/core/`, `src/lib/data/`. Framework-agnostic core modules (`level-parser`, `board-model`, `progress-store`, `microban-levels`) moved from `src/game/core` → `src/lib/core` with zero code changes.
- Theme moved from a JS `theme.js` module into CSS custom properties in `src/app.css`.
- Native buttons replace the bespoke Phaser button factory — click reliability is now a browser concern, not ours.
- Vite configs cleaned up: removed Phaser-specific `manualChunks`, the terser block, and the `phasermsg` plugin.
- `npm run dev` / `npm run build` no longer wrap `node log.js` (Phaser analytics ping removed).

### Added
- `src/views/AppButton.svelte` — shared themed button, wraps native `<button>` with hover, focus-visible, and disabled styles.
- `src/views/Board.svelte` — presentational DOM renderer: floor, walls, targets, boxes, player, each via absolute positioning inside a sized container.
- Live `resize` listener in `GameView.svelte` so tile size re-computes when the window changes.

### Removed
- `phaser` dependency, `terser` devDependency.
- `src/game/` (old `main.js`, `scenes/`, `ui/`, `core/theme.js`).
- `log.js` (Phaser analytics ping).

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
