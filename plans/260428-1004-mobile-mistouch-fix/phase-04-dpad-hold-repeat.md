---
phase: 04
title: D-pad press-and-hold repeat
status: completed
priority: medium
effort: small
files: [src/views/MobileControls.svelte]
depends_on: [phase-02]
---

# Phase 04 — D-pad press-and-hold repeat

## Context

Brainstorm decision D4. Keyboard movement repeats at REPEAT_MS=130 (see GameView.svelte:96). D-pad currently fires on `onclick` only — no parity. Holding a thumb on an arrow does nothing.

Approach (i): Pointer Events (`pointerdown` / `pointerup` / `pointercancel` / `pointerleave`) + setInterval. Covers touch + mouse + stylus uniformly.

## Goal

Holding a D-pad arrow continuously moves the player at 130ms cadence (matches keyboard).

## Implementation

### `src/views/MobileControls.svelte`

1. Add hold-repeat helper:
   ```svelte
   <script>
       const REPEAT_MS = 130;
       let { onMove, onUndo, onRestart, onLevels } = $props();
       let holdTimer = null;

       function startHold(dx, dy) {
           onMove(dx, dy);                         // immediate fire
           clearInterval(holdTimer);
           holdTimer = setInterval(() => onMove(dx, dy), REPEAT_MS);
       }
       function endHold() {
           clearInterval(holdTimer);
           holdTimer = null;
       }
   </script>
   ```
2. Replace each arrow's `onclick` with pointer handlers:
   ```svelte
   <button
       class="arrow up"
       type="button"
       onpointerdown={(e) => { e.preventDefault(); startHold(0, -1); }}
       onpointerup={endHold}
       onpointercancel={endHold}
       onpointerleave={endHold}
       aria-label="Up">▲</button>
   ```
   Repeat for down/left/right (same pattern, different dx/dy).
3. Keep `onclick` removed — pointerdown handles the immediate fire. Don't double-fire.

## Acceptance

- [ ] Single tap on arrow → one move (same as before)
- [ ] Hold arrow 1s → ~7-8 moves (1000/130 ≈ 7.7)
- [ ] Release arrow → movement stops within 130ms
- [ ] Sliding finger off the arrow stops movement (`pointerleave`)
- [ ] Multi-touch on two arrows → second arrow takes over (single `holdTimer` is intentional — last wins)
- [ ] Keyboard hold-repeat unchanged (regression check)

## Risk

- `holdTimer` leak if component unmounts mid-hold. **Mitigation:** Svelte's `$effect` cleanup — add `return () => clearInterval(holdTimer);` in an `$effect` block, or accept that the closure-held interval has no DOM target after unmount (`onMove` callback still valid → fires moves into a remounted GameView). Add cleanup defensively.
- `e.preventDefault()` on `pointerdown` is needed to suppress the synthesized `click` after a release — otherwise a double-fire.
- Repeat speed (130ms) inherited from keyboard. If feels too fast on touch with longer travel, tunable in one place.

## Test

Manual:
1. On phone viewport, mid-level: tap once on right arrow → player moves 1 tile
2. Hold right arrow ~1s → player moves ~7-8 tiles continuously
3. Hold right, slide finger off button → movement stops immediately
4. Hold right, then also press left → either-or behavior; last hold wins
5. Push a box continuously by holding direction → haptic pulses fire on each box-push (regression of pulse logic)
6. Switch to keyboard → hold ArrowRight → still works (not regressed)

## Rollback

Revert phase commit. D-pad returns to tap-only.
