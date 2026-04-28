---
phase: 02
title: In-flow MobileControls (fix D-pad/board overlap)
status: completed
priority: high
effort: medium
files: [src/views/GameView.svelte, src/views/MobileControls.svelte]
---

# Phase 02 — In-flow MobileControls

## Context

Brainstorm decision D5. `MobileControls.svelte` uses `position: fixed; z-index: 50` for both dock-left and D-pad. `.board-wrap` has `overflow: auto` and `max-height: calc(100vh - 260px)` on coarse pointer — vertical overlap protected, but tall puzzles scroll **under** the fixed dock; width is unconstrained so corner-pinned controls float over board content.

Approach α from brainstorm: convert MobileControls to in-flow grid/flex row at bottom of `.screen.game`. Board-wrap becomes flex-grow child. Browser handles z-index/scroll/safe-area naturally.

## Goal

D-pad and action stack live in document flow on mobile. Board-wrap occupies remaining space above. No fixed positioning, no z-index, no max-height clamp tied to magic 260.

## Implementation

### `src/views/GameView.svelte`

1. Make `.screen.game` a column flex container that fills viewport:
   ```css
   .game {
       display: flex;
       flex-direction: column;
       gap: 16px;
       min-height: 100vh; /* or use 100dvh for mobile address-bar */
   }
   ```
2. `.board-wrap` becomes flex-grow (auto-fits remaining space):
   ```css
   .board-wrap {
       flex: 1 1 auto;
       width: 100%;
       overflow: auto;
       min-height: 0; /* required for flex children to allow overflow */
       max-width: calc(100vw - 48px);
   }
   ```
   Remove the `max-height: calc(100vh - 140px)` and the coarse-pointer override `max-height: calc(100vh - 260px)`.
3. `computeTileSize` margin: drop the magic 260. Measure remaining height via `.board-wrap` `clientHeight` after layout, OR keep simpler approach — use `window.innerHeight - hud.offsetHeight - mobileControls.offsetHeight - padding`. KISS: use `requestAnimationFrame` after mount to measure; recompute on `onResize` and `pointer: coarse` change. If complexity grows, fall back to keeping the constant but document it.

   Pragmatic version (KISS):
   - Keep margin constants but reduce to `isCoarse ? 200 : 120` since dock no longer floats.
   - Recompute on resize as today.

### `src/views/MobileControls.svelte`

1. Drop `position: fixed`, `z-index`, `bottom`/`left`/`right` rules from `.dock-left` and `.dpad`.
2. Wrap both into a single bottom-row container:
   ```svelte
   <div class="mobile-dock">
     <div class="dock-left">…</div>
     <div class="dpad">…</div>
   </div>
   ```
3. Style:
   ```css
   .mobile-dock { display: none; }

   @media (pointer: coarse) {
       .mobile-dock {
           display: flex;
           justify-content: space-between;
           align-items: flex-end;
           gap: 12px;
           padding: 0 calc(12px + env(safe-area-inset-left)) calc(12px + env(safe-area-inset-bottom)) calc(12px + env(safe-area-inset-right));
           width: 100%;
       }
       .dock-left { display: flex; flex-direction: column; gap: 8px; }
       .dpad     { display: grid; grid-template-columns: 56px 56px 56px; grid-template-rows: 56px 56px;
                   grid-template-areas: ".    up   .   " "left down right"; gap: 4px; }
   }
   ```

## Acceptance

- [ ] D-pad never visually overlaps board content at 360, 390, 414, 430px wide
- [ ] No `position: fixed` in MobileControls.svelte
- [ ] Board scrolls within `.board-wrap`, not behind dock
- [ ] Safe-area insets respected on iPhone X+
- [ ] Build passes
- [ ] Desktop unchanged (controls still hidden, hud right actions still work)

## Risk

- Layout regression on landscape iPad / iPad split-view. **Mitigation:** smoke test 768×1024 portrait, 1024×768 landscape.
- `min-height: 100vh` vs iOS Safari address bar. **Mitigation:** test in real Safari; switch to `100dvh` if jumping.
- Flex `min-height: 0` on board-wrap is required for overflow scroll inside flex column — easy to forget.

## Test

Manual matrix:
1. 360×640 portrait — small puzzle (Microban 1) and large puzzle (Microban 155)
2. 414×896 portrait
3. 768×1024 portrait + 1024×768 landscape
4. Desktop 1440×900 — verify no regression
5. Verify scroll inside board-wrap (not page scroll) on tall puzzles

## Rollback

`git revert` of phase commit. Pre-phase fixed-positioning still works for desktop.
