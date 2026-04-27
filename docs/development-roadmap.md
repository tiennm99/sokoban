# Development Roadmap

## Phase 0 — Svelte rewrite (complete, 2026-04-12)
- Replace Phaser 3 with Svelte 5 — native DOM buttons, CSS grid board, transform-based animations.
- 60× smaller bundle (~25 kB gzipped vs ~1.5 MB).
- Core modules (parser, board model, progress store, level data) moved verbatim into `src/lib/`.
- Nord theme moved into CSS custom properties.

## Phase 1 — Core game (complete)
- Phaser + Vite scaffolding.
- Menu / Level / Game scenes.
- Arrow-key movement, box pushing, target detection.

## Phase 2 — Overhaul (complete, 2026-04-11)
- Replace 3 hand-crafted levels with the full 155-puzzle Microban set.
- Modularize: core / ui / scenes split, every file <200 LOC.
- BoardModel with undo + move counter.
- Paginated level select (5 pages × 20 levels).
- Nord theme + rounded button factory + animated board renderer.
- WASD support, U/Z undo, R restart, Esc to menu.
- localStorage progress (completed + best move count).
- Drop dead Arcade physics and broken shutdown code.
- Docs folder + README refresh.

## Phase 3 — Mobile Comfort & PWA (complete, 2026-04-27)
- On-screen D-pad + thumb-zone action stack (hidden on desktop, visible on touch).
- Browser gesture blocking (pull-to-refresh, double-tap zoom, long-press select).
- Safe-area insets for notches and nav bars.
- Haptics module (vibrate on box push + win).
- PWA full offline support with Workbox service worker and installable Web Manifest.

## Phase 4 — Polish (planned)
- Sound effects (step, push, win).
- Player facing direction indicator.
- Level category tabs (Easy / Medium / Hard) derived from puzzle size or move count.
- Unit tests for `level-parser` and `board-model`.

## Phase 5 — Stretch (ideas)
- Additional level packs (Sasquatch, Sokogen).
- Custom level importer (paste XSB text).
- Replay / move playback.
- Per-level leaderboards (local only).
