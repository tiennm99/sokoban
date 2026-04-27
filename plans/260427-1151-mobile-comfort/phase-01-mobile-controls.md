# Phase 01 — Mobile Controls + Thumb-Zone Layout

**Priority:** High
**Status:** pending
**Effort:** ~M (1 new component, 2 small touches)

## Context

- Brainstorm: [../reports/brainstorm-260427-1151-mobile-comfort.md](../reports/brainstorm-260427-1151-mobile-comfort.md)
- Codebase: [../../docs/codebase-summary.md](../../docs/codebase-summary.md)
- Touches: `src/views/GameView.svelte`, `src/views/AppButton.svelte`, **NEW** `src/views/MobileControls.svelte`

## Overview

Add an on-screen D-pad (bottom-right) and an action stack (bottom-left: UNDO / RESTART / LEVELS) for touch devices. Current top-HUD action buttons stay on desktop, hide on coarse-pointer devices. No BoardModel changes — calls existing `tryMove`, `undo`, `restart`, `onLevels`.

## Requirements

**Functional**
- D-pad: 4 buttons (▲ ◀ ▶ ▼) → `tryMove(dx, dy)`
- Action stack: UNDO / RESTART / LEVELS → existing handlers
- Visible only on `@media (pointer: coarse)`; hidden on desktop
- Tap = 1 step, no auto-repeat
- `pointerdown` + `e.preventDefault()` to avoid double-firing on synthetic click
- 56×56px D-pad arrows, 48px-tall action buttons (Apple HIG compliant)
- Top HUD on coarse-pointer collapses to status only (`LVL n  Moves  Best`); top action buttons hide

**Non-functional**
- No layout reflow on desktop
- D-pad floats over board with `position: fixed`; reserved bottom space prevents overlap
- `computeTileSize` reduces vertical viewport by ~120px on coarse-pointer to reserve D-pad area
- Lower `minTile` from 10 → 16

## Architecture

```
GameView.svelte
  ├─ <header class="hud"> — desktop: full; mobile: status-only
  ├─ <div class="board-wrap"><Board /></div>
  ├─ <MobileControls
  │     onMove={(dx,dy) => tryMove(dx, dy)}
  │     onUndo={undo}
  │     onRestart={restart}
  │     onLevels={onLevels}
  │   />                                    NEW
  └─ <DonateModal>
```

`MobileControls.svelte`: pure presentational. CSS `display: none` by default; `display: grid` under `@media (pointer: coarse)`.

`AppButton.svelte`: add `touch-action: manipulation` and `user-select: none` to button base styles (also benefits desktop click latency).

## Related Code Files

**Modify**
- `src/views/GameView.svelte` — render `<MobileControls>`, hide HUD action buttons on coarse pointer, adjust `computeTileSize` margin (140 → 260 on coarse, or detect via `matchMedia`)
- `src/views/AppButton.svelte` — `touch-action: manipulation`

**Create**
- `src/views/MobileControls.svelte` (~90 LOC: D-pad grid + left stack + scoped styles)

## Implementation Steps

1. Create `src/views/MobileControls.svelte`:
   - `$props()`: `onMove(dx,dy)`, `onUndo`, `onRestart`, `onLevels`
   - Markup: two `<div class="dock-left">` (UNDO / RESTART / LEVELS via `<AppButton>`) and `<div class="dpad">` (4 arrow buttons)
   - Each arrow: `<button onpointerdown={(e) => { e.preventDefault(); onMove(dx, dy); }}>`
   - Scoped styles: `display: none;` at root; `@media (pointer: coarse) { :root-of-component { display: contents; } .dock-left, .dpad { display: ...; } }`
   - Use `position: fixed; bottom: 12px; left/right: 12px; z-index: 50;`
2. In `GameView.svelte`:
   - Import & render `<MobileControls onMove={tryMove} onUndo={undo} onRestart={restart} {onLevels} />` after `.board-wrap`
   - Wrap top HUD action buttons (`UNDO`/`RESTART`/`LEVELS`) in a `.desktop-actions` div with `@media (pointer: coarse) { .desktop-actions { display: none; } }`
   - Update `computeTileSize`:
     ```js
     const isCoarse = window.matchMedia('(pointer: coarse)').matches;
     const verticalReserve = isCoarse ? 260 : 140;
     const minTile = 16; // was 10
     ```
   - Listen to `matchMedia('(pointer: coarse)').addEventListener('change', onResize)` for live recompute (orientation/dock changes)
3. In `AppButton.svelte`: add `touch-action: manipulation; user-select: none;` to `button` selector
4. Manual smoke test: dev server, devtools mobile emulation (iPhone 12, Pixel 5) — D-pad appears, taps move player, board still fits

## Todo

- [ ] Create `src/views/MobileControls.svelte`
- [ ] Wire `<MobileControls>` in `GameView.svelte`
- [ ] Hide top HUD actions on coarse pointer
- [ ] Update `computeTileSize` (minTile 16, verticalReserve 260 on coarse, listen to matchMedia change)
- [ ] Patch `AppButton.svelte` styles
- [ ] Manual test: mobile emulator (portrait + landscape), small + large levels
- [ ] Verify desktop: no visual change, keyboard works

## Success Criteria

- Mobile (iPhone 12 emulation): D-pad visible, all 4 directions move player, action stack works, board does not overlap controls on Microban level 1 nor "Take the long way home"
- Desktop (1920×1080): no D-pad, no layout change, keyboard arrows / WASD still work
- Tap latency feels instant (no 300ms delay)

## Risks

| Risk | Mitigation |
|------|------------|
| D-pad overlaps board on tiny landscape phone | `computeTileSize` reserves 260px on coarse; if still tight, drop to 220 + smaller buttons |
| Synthetic click after pointerdown causes double-move | `e.preventDefault()` on pointerdown |
| `pointer: coarse` falsely matches Surface laptops with touchscreen | Acceptable — they get D-pad, keyboard still works too |

## Next

- Phase 02: gesture & selection blocking (independent, can ship after this)
