---
title: Mobile D-pad / Board Spacing Tightening
date: 2026-04-28
status: completed
branch: main
mode: fast
blockedBy: []
blocks: []
---

# Mobile D-pad / Board Spacing Tightening

Close perceived gap between puzzle board and on-screen D-pad on touch devices. All changes gated `@media (pointer: coarse)` — desktop untouched.

## Goal

On phones, dead space below short puzzles (e.g. Microban 1) shrinks from ~300px to ~10px so the D-pad sits visually adjacent to the board.

## Reports

- `plans/reports/ui-ux-260428-2218-mobile-dpad-board-spacing.md` — root cause + 4 ranked recommendations.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 01 | Tighten mobile vertical layout (R1 + R2 + R3) | done |

## Scope (in)

- R1: anchor `.board-wrap` to flex-end on coarse pointers (biggest win).
- R2: trim `#app` padding on coarse pointers (`24px` → `12px 12px 0`); update `.board-wrap` `max-width`.
- R3: tighten `.game` gap on coarse pointers (`16px` → `10px`).

## Scope (out, YAGNI)

- R4 D-pad arrow shrink (56→52). Doesn't affect the seam; defer.
- R5 reachability toggle (left-handed mode). Out of scope.
- `computeTileSize` margin tuning (220→195). Defer until R1+R2+R3 are visually verified.
- HUD compaction. Out of scope.

## Key trade-off (acknowledged)

R1 makes tall puzzles initially scroll to the bottom of `.board-wrap`. Player tile is typically near targets so visibility on first frame is fine for nearly all 155 levels. Visual confirmation needed on the two giant finale levels ("Take the long way home", "The Dungeon") before declaring done.

## Success criteria

1. `npm run build` clean.
2. On a coarse-pointer viewport (DevTools mobile preset) Microban 1 board sits within ~12px of the dock top edge.
3. Desktop game view (mouse pointer) layout pixel-identical to current.
4. Tall finale levels still playable — player visible in initial frame OR scrolled-into-view.
