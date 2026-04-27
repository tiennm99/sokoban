# Phase 03 — Safe-area Insets + Haptics

**Priority:** Medium
**Status:** pending
**Effort:** ~S (1 new tiny module + small wiring)

## Context

- Brainstorm: [../reports/brainstorm-260427-1151-mobile-comfort.md](../reports/brainstorm-260427-1151-mobile-comfort.md)
- Depends on: Phase 02 (`viewport-fit=cover` for `env(safe-area-inset-*)` to populate)
- Touches: `src/views/MobileControls.svelte`, `src/views/GameView.svelte`, **NEW** `src/lib/core/haptics.js`

## Overview

Two small polish items:
1. **Safe-area insets** — bottom controls float above iPhone home indicator and Android nav bar via `env(safe-area-inset-bottom)`.
2. **Haptics** — tiny module wrapping `navigator.vibrate`. Pulse on box push & on win. Silent no-op where unsupported (iOS Safari, etc).

## Requirements

- Bottom-left action stack and bottom-right D-pad respect safe-area insets
- `vibrate(10)` on a move that pushed a box
- `vibrate(60)` on `isSolved()` transition (first time only)
- No vibrate on plain step or wall bump
- Module is framework-agnostic (lives under `lib/core/` like `board-model.js`)

## Architecture

```
src/lib/core/haptics.js      NEW
  └─ pulse(ms)               navigator.vibrate fallback no-op

src/views/GameView.svelte    MOD
  └─ syncFromModel():
       compare boxes pre/post → if any moved, pulse(10)
       on win transition       → pulse(60)

src/views/MobileControls.svelte    MOD
  └─ .dock-left, .dpad add env(safe-area-inset-bottom) padding
```

Detection of "box pushed": before calling `model.tryMove(dx, dy)`, snapshot box positions; after, compare. If different → push happened. (Alternative: extend `tryMove` to return `{ moved, pushedBox }` — slightly cleaner, but breaks framework-agnostic contract less if we keep it as `boolean`. Go with snapshot in GameView; BoardModel unchanged.)

Actually simpler: read `model.history[model.history.length - 1]?.movedBox` after move. The history entry already records `movedBox: boolean`. Use that.

## Related Code Files

**Create**
- `src/lib/core/haptics.js`:
  ```js
  // Tiny wrapper around navigator.vibrate. Silent no-op where unsupported.
  export function pulse(ms) {
      if (typeof navigator === 'undefined' || !navigator.vibrate) return;
      try { navigator.vibrate(ms); } catch { /* ignore */ }
  }
  ```

**Modify**
- `src/views/GameView.svelte`:
  - `import { pulse } from '../lib/core/haptics.js';`
  - In `tryMove(dx, dy)`: if move succeeded and `model.history.at(-1).movedBox`, call `pulse(10)`
  - In `syncFromModel()`: when transitioning `won = true`, call `pulse(60)`
- `src/views/MobileControls.svelte`:
  - Bottom positioning: `bottom: calc(12px + env(safe-area-inset-bottom));`
  - Left/right: `calc(12px + env(safe-area-inset-left/right));`

## Implementation Steps

1. Create `src/lib/core/haptics.js` (≤15 LOC)
2. Update `MobileControls.svelte` styles:
   ```css
   .dock-left {
       position: fixed;
       bottom: calc(12px + env(safe-area-inset-bottom));
       left: calc(12px + env(safe-area-inset-left));
   }
   .dpad {
       position: fixed;
       bottom: calc(12px + env(safe-area-inset-bottom));
       right: calc(12px + env(safe-area-inset-right));
   }
   ```
3. Wire haptics in `GameView.svelte`:
   - In `tryMove(dx, dy)` after `if (model.tryMove(dx, dy)) syncFromModel();`, also check `model.history.at(-1)?.movedBox` and call `pulse(10)`
   - In `syncFromModel()`, when setting `won = true`, call `pulse(60)`
4. Manual test: Android Chrome (vibrate works) — push a box, feel buzz; complete a level, feel longer buzz. iOS Safari — verify no errors thrown.

## Todo

- [ ] Create `src/lib/core/haptics.js`
- [ ] Wire safe-area insets in `MobileControls.svelte`
- [ ] Call `pulse(10)` on push in `GameView.tryMove`
- [ ] Call `pulse(60)` on win in `GameView.syncFromModel`
- [ ] Test on Android (vibrate works) + iOS (no error)

## Success Criteria

- iPhone notch device emulation: D-pad and action stack visible above home indicator (~34px gap)
- Android Chrome: vibrate fires on push & win (verify via devtools console + manual)
- iOS Safari: no JS error, no vibrate (silent no-op as expected)
- Desktop: unchanged, no vibrate calls fire (browsers ignore safely)

## Risks

| Risk | Mitigation |
|------|------------|
| `vibrate(10)` triggers on every step in long box-push runs | Acceptable — push runs are rare; if too noisy, throttle to once per 200ms |
| Some Android browsers require user-gesture for vibrate | Tap originates the move → counts as user gesture |

## Next

- Phase 04: PWA manifest + service worker
