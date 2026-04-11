# Sokoban Overhaul

**Date:** 2026-04-11
**Status:** In Progress

## Goal
- Replace 3 hand-crafted levels with 100 solvable Microban levels (David W. Skinner, public, freely distributable).
- Improve UI/UX (theme, paginated level select, move counter, undo, keyboard shortcuts, responsive tile sizing).
- Clean up code (modularize under 200 LOC/file, remove dead physics, fix broken shutdown, remove unused import).
- Update docs per rules.

## Phases
- phase-01: Data — Microban levels as XSB strings + parser. Status: pending
- phase-02: Core — board model, persistence, theme. Status: pending
- phase-03: UI — button factory, board renderer. Status: pending
- phase-04: Scenes — refactor Menu/Level/Game scenes. Status: pending
- phase-05: Docs — docs/ folder + README. Status: pending
- phase-06: Verify — build + manual smoke test. Status: pending

## Key Decisions
- XSB parsing at runtime (compact storage, standard format).
- Flood-fill floor from player (only renders inside-level floor).
- localStorage key: `sokoban-progress-v1`.
- 5x4 paginated level grid (20/page × 5 pages = 100).
- Theme: Nord palette.

## Reports
- Source: Microban by David W. Skinner, 155 puzzles, April 2000 (freely distributable with credit).
