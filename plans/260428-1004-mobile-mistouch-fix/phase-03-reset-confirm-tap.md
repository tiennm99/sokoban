---
phase: 03
title: Reset two-tap arming
status: completed
priority: medium
effort: small
files: [src/views/MobileControls.svelte]
depends_on: [phase-02]
---

# Phase 03 — Reset two-tap arming

## Context

Brainstorm decision D3. RESET button is currently one-tap destructive — mid-puzzle mis-tap wipes player progress. User picked option (a): two-tap arming. First tap arms (label flips, color changes); second tap within 2s actually resets; auto-disarms after timeout.

Keyboard `R` is unaffected (assumed deliberate by power users).

## Goal

Mobile RESET requires a second confirmation tap within 2 seconds. Visual delta is unmistakable when armed. No modal, no extra dependencies.

## Implementation

### `src/views/MobileControls.svelte`

1. Add local state for armed flag + timer:
   ```svelte
   <script>
       let { onMove, onUndo, onRestart, onLevels } = $props();
       let resetArmed = $state(false);
       let armTimer = null;

       function disarm() { resetArmed = false; armTimer = null; }

       function handleReset() {
           if (resetArmed) {
               clearTimeout(armTimer);
               disarm();
               onRestart();
               return;
           }
           resetArmed = true;
           clearTimeout(armTimer);
           armTimer = setTimeout(disarm, 2000);
       }
   </script>
   ```
2. Update RESET button:
   ```svelte
   <button
       class="action"
       class:armed={resetArmed}
       type="button"
       onclick={handleReset}
       aria-label={resetArmed ? 'Tap again to confirm reset' : 'Reset'}>
       {resetArmed ? 'TAP AGAIN' : 'RESET'}
   </button>
   ```
3. Add `.armed` style — strong visual delta:
   ```css
   .action.armed {
       background: var(--danger);
       color: var(--bg);
       border-color: var(--danger);
   }
   ```

## Acceptance

- [ ] Single tap on RESET does not restart the level
- [ ] Label flips to "TAP AGAIN" with red background
- [ ] Second tap within 2s restarts the level
- [ ] No second tap → button auto-disarms after 2s, label reverts
- [ ] Tapping UNDO or LVLS while armed does NOT cancel the arm (only 2s timeout cancels) — *acceptable behavior, document if questioned*
- [ ] Keyboard `R` still resets immediately (untouched)
- [ ] aria-label updates with state for screen readers

## Risk

- Cleanup of `armTimer` on unmount: Svelte 5 — if user leaves view while armed, timer fires on disarmed state (no-op). Safe.
- Color contrast of armed state: verify `--danger` on `--bg` meets WCAG AA. (Likely fine — reuse existing token.)

## Test

Manual:
1. On mobile viewport, mid-level: tap RESET once → label changes, no reset
2. Tap again within 2s → level resets, label reverts
3. Tap once, wait 3s → label reverts, level untouched
4. Spam-tap RESET 5 times rapidly → resets exactly once on the 2nd tap (subsequent taps from disarmed state would re-arm; this is fine)
5. Press R on keyboard → immediate reset (regression check)

## Rollback

Revert phase commit. Reset returns to one-tap behavior.
