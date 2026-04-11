# Sokoban — Product Development Record

## What it is
A from-scratch Sokoban implementation by tiennm99. Phaser 3 + Vite, deployed to GitHub Pages. The engine, UI, parser, and progression system are original code. Puzzle layouts come from David W. Skinner's freely distributable **Microban** set (100 of his puzzles shipped) — layouts only, no code reused from Skinner's own programs.

## Goals
- Clean, beginner-friendly Sokoban that runs in any modern browser with no install.
- 100 curated puzzles, progressing from easy to moderately tricky.
- Keyboard-first UX with undo, restart, move counter, persistent progress.
- Small, well-organized codebase (<200 LOC per file) that's easy to extend.

## Non-goals
- Custom level editor (puzzles are fixed, shipped with the build).
- Networked play / leaderboards.
- Sound / music (kept out to stay lightweight; may add later).

## Target audience
Casual puzzle fans, Sokoban beginners. Microban set chosen specifically because it's designed for beginners and illustrates one concept per puzzle.

## Success criteria
- All 100 levels playable end-to-end.
- Progress (completion + best moves) persists across sessions.
- Build output fits in the default Vite budget.
- Runs smoothly on desktop browsers at 1024×768 canvas (scaled responsively).

## Credits
- Puzzle layouts: Microban by David W. Skinner (April 2000). Used per the collection's free-distribution terms with credit. Only the level designs — none of Skinner's code.
- Game code: tiennm99 (with AI pair-programming from Claude).
- Engine: Phaser 3.
