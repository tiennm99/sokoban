---
agent: code-reviewer
date: 2026-04-27
slug: mobile-comfort-review
plan: 260427-1151-mobile-comfort
---

# Mobile-Comfort Overhaul — Code Review

Adversarial review of the 4-phase mobile overhaul (D-pad, gesture blocking, safe areas + haptics, PWA).

## Scope

- `src/views/MobileControls.svelte` (new)
- `src/views/GameView.svelte` (modified: tile-size, $effect, MobileControls wiring, haptics)
- `src/views/Board.svelte`, `src/views/AppButton.svelte` (touch CSS)
- `src/app.css`, `index.html` (gesture blocking, viewport, theme)
- `src/lib/core/haptics.js` (new)
- `vite/config.prod.mjs` (VitePWA), `public/pwa-*.png`, `public/apple-touch-icon.png`

## Overall Assessment

Solid, tightly scoped UI-only change. Game core untouched. Code is concise and follows KISS. A handful of real correctness/UX issues plus several smaller hygiene items below — none are merge-blockers but the **#1 click-bypass** and **#2 a11y** ones should land before public rollout.

---

## Critical Issues

### 1. `pointerdown` + `e.preventDefault()` skips synthetic click — but ALSO skips focus/keyboard activation on D-pad buttons

**File:** `src/views/MobileControls.svelte:11-16, 20-29`

```js
function press(handler) {
    return (e) => { e.preventDefault(); handler(); };
}
```
…wired only to `onpointerdown`. Implications:

- A `<button>`'s default behavior on `pointerdown` is to take focus. `preventDefault()` on `pointerdown` **suppresses focus** on the button in WebKit/Blink. After tapping, the focused element is still whatever was focused before (or `<body>`). Combined with no `onclick` handler, the button is **not actually keyboard-activatable**: pressing Tab to the D-pad and hitting Enter/Space does nothing.
- This affects users with external keyboards on iPad/Chromebook in tablet mode (the very class of devices that triggers `pointer: coarse`). It also breaks AT switch-control on iOS, which dispatches synthetic clicks, not pointer events.
- Fix: add an `onclick={() => handler()}` alongside `onpointerdown`. The synthetic click will be redundant on touch (already handled at pointerdown), but no double-trigger occurs because `onclick` only fires on the *focused/activated* path. If you want to be safer, gate with `e.pointerType === 'mouse' ? null : preventDefault()`, or just call `e.preventDefault()` only when `e.pointerType !== 'mouse'`.

### 2. Glyph-only buttons — `aria-label` is set, but text content is the symbol so screen readers may double-announce, and **the buttons have no visible text label fallback**

**File:** `src/views/MobileControls.svelte:20-29`

`aria-label` overrides the accessible name, so AT will read "Undo / Restart / Levels / Up / Down / Left / Right" — that part is fine. However:

- `↶ ⟳ ▦` are not on the Unicode "emoji presentation" path; they're text-style symbols. On Android Chrome with a font that lacks them they render as tofu. On iOS they render but `↶` (U+21B6) is small and its meaning ("undo") is non-obvious.
- Recommend either swapping to commonly-rendered symbols (e.g. an SVG inline, or text "↺"/"↻" for restart and just "≡" for levels) **or** adding a short visible label below each glyph at the cost of a slightly bigger button.
- Note also: per WCAG 2.5.5 (Target Size), 48×48 minimum is met for the action stack and 56×56 for the D-pad. Good.

### 3. `maximum-scale=1.0, user-scalable=no` is a hard a11y red flag

**File:** `index.html:7`

iOS Safari now ignores `user-scalable=no`, but Android still honors it. This blocks users who need to pinch-zoom for vision reasons. The plan's stated goal ("kill double-tap zoom") is already achieved by `touch-action: manipulation` on buttons and `touch-action: none` on the board.

- **Recommendation:** drop `maximum-scale=1.0, user-scalable=no`. Keep `viewport-fit=cover` and `width=device-width, initial-scale=1`. Re-test for double-tap zoom — if it sneaks back in elsewhere, fix it with `touch-action`, not by disabling page zoom.

### 4. `touch-action: none` on `.board` blocks legitimate page scroll on small viewports

**File:** `src/views/Board.svelte:100`

`.board` lives inside `.board-wrap` which is `overflow: auto` (`GameView.svelte:232-237`). On tall narrow phones with the very large finale levels, the user needs to scroll the board-wrap to see the whole maze. With `touch-action: none` on `.board`, **the board itself won't scroll the parent on touch** — only swiping in the small margin between `.board` and `.board-wrap` edges (i.e. inside `.board-wrap` but outside `.board`) will scroll. On a phone where the board fills the wrap, scrolling becomes effectively impossible.

- The plan justifies `touch-action: none` to suppress double-tap zoom and pull-to-refresh, but those are already covered by `overscroll-behavior: contain` on body and `touch-action: manipulation` on buttons.
- **Recommendation:** change `.board { touch-action: none }` → `touch-action: pan-x pan-y pinch-zoom` (or simply `touch-action: manipulation`). This still blocks double-tap zoom but allows the parent wrap to scroll.
- (When tap-to-walk is reintroduced later, switch back to `none` and handle pointer events manually — the comment in the code should flag this trade-off.)

---

## High Priority

### 5. `Array.prototype.at()` — fine for targets, but worth noting

**File:** `src/views/GameView.svelte:78` — `model.history.at(-1)?.movedBox`

`Array.prototype.at` is supported in iOS 15.4+, Chrome 92+, Firefox 90+. PWA install targets are modern. Fine. Could equivalently use `model.history[model.history.length - 1]?.movedBox` for zero-cost portability, but not worth touching.

### 6. `$effect` adds matchMedia listener but `onResize` covers the same case via `window.resize`

**File:** `src/views/GameView.svelte:127-133`

When pointer-type changes (e.g. iPad keyboard attach), Safari typically *also* fires a `resize` event — `onresize` already calls `computeTileSize()`, so the `$effect` listener is partially redundant. It's still correct to keep it for the rare case where pointer-type flips without a viewport-size change (e.g. Bluetooth mouse pair on Android tablet), but worth a one-line comment that the two listeners intentionally overlap.

Cleanup is correct (`return () => mq.removeEventListener(...)`). 

### 7. `onresize` runs unthrottled

**File:** `src/views/GameView.svelte:121-123, 140`

`window.onresize` fires rapidly during rotation/keyboard show. Each call rebuilds the tile-size and triggers a Board re-render. For the larger Microban finale levels (800+ floor cells) this can stutter on low-end Android. Wrap in `requestAnimationFrame` or a 50ms debounce. Low-impact, but cheap to fix.

### 8. `scope` and `start_url` should ideally be relative

**File:** `vite/config.prod.mjs:16-17`

Hard-coded `'/sokoban/'`. Matches `package.json` homepage and `base`, so works on production GH Pages. But:

- If someone forks the repo to `username.github.io/<other-name>/`, PWA install will break in a way the dev never sees in Lighthouse on `localhost`.
- Consider deriving scope/start_url from `import.meta.env.BASE_URL` or just `'./'` (the spec accepts relative URLs in the manifest as of 2024 in Chromium/WebKit). Not critical for this repo, but the coupling is brittle.

### 9. PWA generates a service worker; no unregister / kill-switch on dev/codeserver

**File:** `vite/config.prod.mjs` (PWA only registered here — good), but…

The dev/codeserver Vite configs don't register the SW, which is correct. **However**, if a user previously visited the production GH Pages site and the SW cached `/sokoban/`, then later visits the same origin with a different path (or vice-versa with `localhost`), the cached SW persists. There's no in-app "unregister" or version bump strategy beyond Workbox's autoUpdate. For this small repo, fine — but be aware that if you ever change the manifest scope/name, users will need a hard reset.

- Also: there is **no explicit `registerSW()` call** in `src/main.js`. With `registerType: 'autoUpdate'` and no `injectRegister` option set, vite-plugin-pwa defaults to `injectRegister: 'auto'` which auto-injects a `<script>` tag at build time. This works, but it's invisible — add a comment in `vite/config.prod.mjs` so the next dev knows where SW registration comes from. Or set `injectRegister: 'auto'` explicitly for clarity.

---

## Medium Priority

### 10. `computeTileSize` margin constant (260 / 140) is a magic number

**File:** `src/views/GameView.svelte:46`

`260` should match the actual reserved height: `12 (bottom) + 56*2 + 4 (gap) (D-pad) + safe-area-inset-bottom + headroom`. The constant is hand-calibrated. Acceptable, but extract to a named const at module top with a comment explaining the breakdown so it doesn't drift if D-pad sizes change.

### 11. `overscroll-behavior: contain` is on `html, body` — but the `.board-wrap` is the actual scroller

**File:** `src/app.css:51`

If the `.board-wrap` ever scrolls to its edge, the user can pull-to-refresh through it on iOS (Safari ignores body's `overscroll-behavior` for nested scrollers in some cases). Add `overscroll-behavior: contain` to `.board-wrap` for completeness.

### 12. `won` overlay is a click-trap that the D-pad sits on top of via `z-index: 50`

**File:** `src/views/GameView.svelte:251-260` overlay z-index 100, MobileControls z-index 50. Overlay > D-pad. Good — D-pad is hidden behind overlay so the player can't accidentally walk during the win celebration. Confirmed correct.

But: clicking through the overlay backdrop does nothing (no `onclick={onLevels}` or close behavior). Some users will expect a tap-outside-to-dismiss. Not a regression, but worth flagging.

### 13. `App.svelte` defines `@keyframes pulse` (CSS) and you import a function `pulse` from haptics.js

**File:** `src/App.svelte:67`, `src/lib/core/haptics.js:5`

No actual collision — CSS keyframe namespace is separate from JS. But the same identifier in two files is confusing for grep. Rename CSS keyframe to `heartbeat` to match the comment ("heart" pulse).

### 14. `pulse(60)` on win + `pulse(10)` on box-push back-to-back

**File:** `src/views/GameView.svelte:71, 78`

If the move that wins the game is a box-push, both fire in the same tick: `tryMove` calls `pulse(10)` then `syncFromModel` calls `pulse(60)`. `navigator.vibrate(60)` immediately after `vibrate(10)` overrides the first. So you get a 60ms buzz on the winning push, not 10+60. That's actually fine — better than stacking — but worth a comment so the next reader knows.

### 15. PWA icons are programmatically generated via ImageMagick

Visually fine for launch but they may render flat / over-decorate poorly when used as a maskable icon. The same `pwa-512x512.png` is reused for both `purpose: 'any'` and `purpose: 'maskable'`. Maskable expects safe-zone padding (~80% center). If the icon already has full bleed, Android's circle/squircle mask will crop important pixels.

- Recommendation: generate a separate `pwa-512x512-maskable.png` with extra padding, or verify the current icon has the safe zone. Not blocking.

---

## Low Priority

### 16. `MobileControls.svelte` `.dock-left` and `.dpad` — base style sets `display: none`, then media query sets `display: flex/grid`. Inside the media query you redeclare `display`, but the **base styles for `.action` and `.arrow` are also outside the media query** (lines 65-93)

This means on desktop the `.action` and `.arrow` style rules are still parsed and matched — fine, no DOM elements to style. Just visual noise; could nest the visual styles inside the media query to save a few bytes.

### 17. `apple-touch-icon` link is in `index.html` AND `includeAssets` of the PWA manifest

**File:** `index.html:6`, `vite/config.prod.mjs:11`

Slight duplication. `vite-plugin-pwa`'s `includeAssets` ensures it's precached; the `<link>` ensures iOS Safari uses it without a manifest. Both needed, no actual problem — but worth noting these are in two places.

### 18. `progressStore.recordCompletion` runs BEFORE `pulse(60)`

**File:** `src/views/GameView.svelte:69-71`

If `recordCompletion` ever throws, the haptic fires after. Order is fine. But the win check uses `moves` (a `$state` snapshot already updated 2 lines earlier). Confirmed correct, just dense. No action.

### 19. `pulse` function name collides conceptually with CSS animation; consider `vibrate(ms)` or `buzz(ms)`

**File:** `src/lib/core/haptics.js`

Cosmetic. Skip if not refactoring.

### 20. No focus management when win overlay opens

**File:** `src/views/GameView.svelte:182-198`

After winning, focus stays on whatever was focused before the win (often nothing on touch). Keyboard users have to tab to find "NEXT LEVEL". Auto-focus the primary action when overlay opens. Not a regression — was probably broken before this PR.

---

## Edge Cases Found by Scout (read of related files)

- **`board-model.js:60-63` undo when `last.movedBox` is true** — correctly restores box position. No issue.
- **`computeTileSize` returns 48 when `level` is null** — used in `tileSize = $state(computeTileSize())`, OK because Board never renders in that branch (parseError path). No issue.
- **No `onkeydown` filtering when overlay/donate modal is open** — pressing Arrow keys after winning is gated by `if (won) return` in `tryMove`, but Esc still works, R triggers restart even though `won` is true → restart works. Pressing Z/U with `won` true returns early in `undo()`. This is consistent.
- **`#key levelIndex}` in App.svelte remounts GameView on level change** — correctly resets `tileSize`, `won`, etc. Good.
- **D-pad onMove handler signature** matches `tryMove(dx, dy)`. 

---

## Positive Observations

- Clean separation: `MobileControls` is a dumb component that takes four callbacks and hides itself via media query. KISS done right.
- `haptics.js` defensive coding (`typeof navigator`, `try/catch`) is exactly right — silent no-op for SSR/desktop/embedded WebViews.
- `(pointer: coarse)` instead of UA sniffing or width media query is the correct modern signal for touch devices.
- Game core (`board-model.js`) untouched. Plan goal honored.
- Hiding desktop HUD action duplicates on coarse pointer (`.desktop-actions { display: none }`) prevents stale UI on touch — nice touch.
- `#key levelIndex` keeps GameView remount semantics — no stale state across level transitions.

---

## Recommended Actions (priority order)

1. **Drop `maximum-scale=1.0, user-scalable=no`** from viewport meta (a11y).
2. **Add `onclick` handler alongside `onpointerdown`** in `MobileControls`, or guard `preventDefault` to non-mouse pointer types — fixes keyboard activation and AT switch-control.
3. **Change `.board { touch-action: none }`** to `touch-action: manipulation` (or `pan-x pan-y pinch-zoom`) so the wrapper can scroll on small phones.
4. Verify maskable PWA icon has 80% safe-zone — or generate separate maskable variant.
5. Add `overscroll-behavior: contain` to `.board-wrap`.
6. Debounce/RAF `onResize`.
7. Document `injectRegister` behavior in `vite/config.prod.mjs`.
8. Consider relative `scope`/`start_url` in PWA manifest so forks work.

---

## Metrics

- LOC reviewed: ~600 across 8 files
- Critical issues: 4
- High: 5
- Medium: 6
- Low: 5
- Type coverage: N/A (vanilla JS)
- Lint/test commands: not run (review-only mode)

## Unresolved Questions

1. Is double-tap zoom still suppressed without `user-scalable=no`? Needs manual test on Android Chrome.
2. Was the maskable PNG generated with safe-zone padding? Visual inspection of `pwa-512x512.png` needed.
3. Will GH Pages deploy continue to use absolute `/sokoban/` base, or is there intent to support forks at different paths? Affects whether to keep absolute scope.

**Status:** DONE_WITH_CONCERNS
**Summary:** Implementation is clean and well-scoped. Three real UX/a11y issues (pointerdown-only handler, `user-scalable=no`, `touch-action: none` on scrollable board) should land before public rollout; remaining items are hygiene.
**Concerns:** Issues #1-#4 above are user-visible regressions for accessibility and tall-level scrolling.
