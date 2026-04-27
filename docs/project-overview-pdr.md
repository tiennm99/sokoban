# Sokoban — Product Development Record

## What it is
A from-scratch Sokoban implementation by tiennm99. Svelte 5 + Vite, deployed to GitHub Pages. The engine, UI, parser, progression system, and mobile controls are original code. Puzzle layouts come from David W. Skinner's freely distributable **Microban** set — the full 155-puzzle set is shipped — layouts only, no code reused from Skinner's own programs. Mobile-optimized with on-screen D-pad, haptics, safe-area insets, and PWA offline play.

## Goals
- Clean, beginner-friendly Sokoban that runs in any modern browser with no install.
- Full 155-puzzle Microban set shipped, progressing from tiny beginner teasers up to the two huge finale mazes.
- Keyboard-first desktop UX + touch-first mobile UX. Undo, restart, move counter, persistent progress on all devices.
- Installable PWA: play offline, add to home screen, standalone fullscreen on iOS and Android.
- Small, well-organized codebase (<200 LOC per file) that's easy to extend.

## Non-goals
- Custom level editor (puzzles are fixed, shipped with the build).
- Networked play / leaderboards.
- Sound / music (kept out to stay lightweight; may add later).
- Swipe gestures, pinch-zoom, orientation lock (D-pad + keyboard sufficient).

## Target audience
Casual puzzle fans, Sokoban beginners. Microban set chosen specifically because it's designed for beginners and illustrates one concept per puzzle.

## Success criteria
- All 155 levels playable end-to-end, including the oversized finale mazes that rely on responsive tile sizing.
- Progress (completion + best moves) persists across sessions.
- Mobile: D-pad reachable one-handed on ≤480 px width. No browser interference (pull-to-refresh, zoom, selection). Haptics on box push + win.
- PWA: Installable via "Add to Home Screen", works offline, Lighthouse PWA audit passes.
- Build output fits in the default Vite budget.
- Runs smoothly on all devices: desktop 1024×768, tablet, and phone 280×480.

## Credits
- Puzzle layouts: Microban by David W. Skinner (April 2000). Used per the collection's free-distribution terms with credit. Only the level designs — none of Skinner's code.
- Game code: tiennm99 (with AI pair-programming from Claude).
- Engine: Phaser 3.
