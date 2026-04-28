---
title: Mobile Mistouch & Layout Fix — Code Review
date: 2026-04-28
slug: mobile-fix-review
related:
  - ../plan.md
  - ../../reports/brainstorm-260428-1004-mobile-mistouch-and-layout.md
status: review-complete
---

# Code Review — Mobile Mistouch & Layout Fix

Scope: `src/App.svelte`, `src/views/GameView.svelte`, `src/views/MobileControls.svelte` (uncommitted, ~150 LOC net).

## Verdict

Implementation honors all 6 brainstorm decisions. No critical bugs, no security issues, no data leaks. Two real concerns: a page-scroll bug from `min-height: 100dvh` inside padded `#app`, and a WCAG-AA contrast fail on the armed-RESET button. Multi-touch semantics are implemented correctly per "last-press wins" but have a non-obvious side effect worth documenting.

## Critical
none.

## High

- **GameView.svelte:212 — `.game { min-height: 100dvh }` inside `#app` (padding 24px) forces page scroll.**
  `#app` (app.css:62) is flex container with `padding: 24px` (48px vertical). Setting `.game` to `min-height: 100dvh` makes it ≥ viewport tall, so total body height ≥ `100dvh + 48px`. On iOS even with `overscroll-behavior: contain`, this allows page rubber-band scroll during gameplay — partially defeats the dock-overlap fix on small landscape phones.
  Fix: either `min-height: 100%` (relative to #app), or remove the rule entirely (flex column with `flex: 1 1 auto` board-wrap doesn't strictly need the min-height — the dock will sit at the natural bottom of content), or scope to `(pointer: coarse)` and pair with `padding: 0` override on `#app`.
  Quick check: open in mobile devtools at 414×800, scroll the page — there should be zero overflow when the board fits comfortably.

- **MobileControls.svelte:160 — `armed` button fails WCAG AA contrast.**
  `var(--danger)` (#BF616A) bg with `var(--bg)` (#2E3440) text → contrast ≈ 3.1:1. Button text is 13px/700 (app.css inherits — under WCAG "large text" threshold of 14pt bold ≈ 18.67px), so AA needs 4.5:1. Per code-standards spec, accessibility matters.
  Three options:
  1. Use `var(--text)` (#ECEFF4) on `--danger` → 3.4:1 (still fails, but closer).
  2. Add a stronger danger variant (e.g. `--danger-strong: #8B3A41`) and use white text → ≥ 6:1.
  3. Accept AA-large by bumping armed font-size to 14pt bold (≥ 18.67px) — but that changes layout.
    Recommend option 2 (cleanest, also gives a reusable token).

## Medium

- **MobileControls.svelte:13–24 — single shared `holdTimer` means releasing finger #2 cancels the hold from finger #1.**
  Sequence: user holds Up (interval running), then briefly taps Right (interval reassigned to right). `pointerup` on Right fires `endHold()` → interval cleared. User's first finger is still on Up but no further moves fire until they lift and re-press. The plan accepts "last wins" semantics, but doesn't acknowledge this implicit cancel-on-other-release. Either:
  - Document explicitly in the source comment near `startHold` so the next maintainer doesn't mistake it for a bug, OR
  - Track active pointers per-button (Map of pointerId → direction) and only stop the interval whose pointerId is up'd. KISS says the first option suffices for a Sokoban game where two-finger inputs are unintended anyway.

- **MobileControls.svelte:72,80,88,96 — keyboard accessibility hole.**
  Arrow buttons no longer respond to keyboard activation (Enter/Space): work moved from `onclick` to `onpointerdown`. Pressing Enter on a focused arrow button now does nothing because no synthesized pointerdown fires. Mitigated because the dock is hidden on `pointer: fine` and `GameView` has `<svelte:window onkeydown>` for arrows directly — but a coarse-pointer device with a paired keyboard (iPad + Magic Keyboard, Android tablet + BT keyboard) loses the dock as a fallback.
  Either: add `onclick={() => { onMove(dx, dy); }}` alongside pointer handlers (one-shot move on Space/Enter — no auto-repeat needed since real keyboard does that), OR document this trade-off if intentional.

- **GameView.svelte:46 — tile-size margin estimate is fragile.**
  `margin = 220` (coarse) assumes dock takes ~120px (52px buttons + 12px padding + 12px safe-area + 8px gap × 2 + …). Actual rendered dock height with three 44px action buttons stacked + 8px gap = `44*3 + 8*2 = 148px` plus padding-bottom `12 + safe-area-bottom`. On iPhone with 34px home-indicator inset, dock height ≈ 148 + 12 + 34 = 194px. Add hud (~80) + #app padding (~48) → margin should be closer to 320 not 220.
  Net effect: `computeTileSize` over-estimates available height, so `maxByHeight` may exceed real space → board overflows and `.board-wrap`'s internal `overflow: auto` kicks in. Functionally OK (board scrolls inside its wrapper), but defeats the "fit the puzzle on screen" goal.
  Cheap fix: remeasure on a real iPhone and adjust margin to ~260–280; or use `getBoundingClientRect()` on the dock once mounted and feed back into the calc.

- **GameView.svelte:208–213 — `min-height: 100dvh` not gated on coarse pointer.**
  Desktop users get the same column stretch even though desktop hides MobileControls. Result: lots of empty space below the board on a tall desktop window. Cosmetic but worth scoping the rule to `@media (pointer: coarse)` when fixing the High item above.

## Low

- **MobileControls.svelte:38, 30 — `disarm()` writes `armTimer = null` but `handleReset` (line 43) overwrites with `setTimeout(...)` after `clearTimeout(armTimer)`.**
  Race-free, but `disarm` setting `armTimer = null` is pointless — the `clearTimeout(null)` is a no-op anyway. Drop `armTimer = null` from `disarm` for symmetry, or keep it and document why. Nit.

- **MobileControls.svelte:11–24 — `holdTimer` is plain `let` (not `$state`), correctly chosen** (no template binding needs reactivity). Good, but worth a one-line comment so future readers don't "fix" it to `$state`.

- **MobileControls.svelte:62 — `aria-label={resetArmed ? 'Tap again to confirm reset' : 'Reset'}` changes mid-interaction.**
  Screen readers may not re-announce. Consider `aria-live="polite"` on a sibling `<span class="visually-hidden">` instead of toggling label, so the state change is announced. Low priority since the visible label also changes ("RESET" → "TAP AGAIN").

- **GameView.svelte:67–71 — `won` triggers but interval keeps firing until pointer release.**
  Not a real bug (`tryMove` early-returns on `won`), but timer runs idle for up to a few seconds between win and finger lift. Cosmetic: `endHold()` on win, or check `won` in the interval body. Skip unless profiling shows it matters.

## Nit

- **App.svelte:34** — extracting the footer-visible logic into a named local (`const showFooter = view !== 'game'`) would read slightly cleaner if the condition grows. Trivial.
- **GameView.svelte:47** — comment "in-flow mobile dock" is helpful; consider also noting that the 220 figure was eyeballed and tracking issue if measured-vs-actual diverges (ties to Medium item above).
- **MobileControls.svelte:72** — repeated inline arrow handlers across four buttons is fine but a small `makeStartHold(dx, dy)` factory would DRY. Optional.
- **App.svelte:51** — `pointer-events: none` on footer with `pointer-events: auto` on the link is a nice touch — preserves the original mistouch-mitigation idea even where the footer is shown. No change needed.

## Edge Cases Scouted

- Pointer capture on iOS: confirmed `pointerleave` won't fire on touch (implicit pointer capture), but `pointerup` always does — auto-repeat correctly ends on release. No action needed.
- Win mid-hold: GameView gates `tryMove` on `won`; interval fires harmlessly until release. Not a regression.
- Component unmount mid-hold (back nav): `$effect(() => () => {...})` cleanup runs on Svelte 5 unmount per docs. Verified — this works even with no reactive deps because cleanup tied to effect lifecycle, not deps. Sources: [svelte.dev/$effect docs](https://svelte.dev/docs/svelte/$effect), [Svelte tutorial](https://svelte.dev/tutorial/svelte/effects).
- Two-finger flick (slide from one arrow to another): on touch, due to implicit pointer capture, the pointer stays bound to the first button until release — sliding off doesn't re-trigger pointerdown on the new button. Expected and consistent with hardware D-pad.
- Reset arming persists across UNDO/LVLS taps: confirmed acceptable per plan. Only the 2s timeout disarms it. Note: tapping LVLS while armed will navigate away and unmount the component — `$effect` cleanup clears `armTimer` properly. No leak.
- `e.preventDefault()` on `pointerdown`: blocks synthesized click and focus, both desirable. No `onclick` on arrows so no double-fire risk.
- Safe-area: `viewport-fit=cover` set in index.html → `env()` resolves correctly. App.svelte footer and MobileControls dock both honor insets.
- `class:armed={resetArmed}` correctly compiles in Svelte 5; no migration concern.

## Positive Observations

- `$effect` cleanup pattern is correct for Svelte 5 — no `onDestroy` import needed.
- `pointer: coarse` media query gates the entire dock — desktop unaffected.
- Pointer Events (vs touch+mouse separately) is the right choice; covers hybrid devices.
- In-flow flex layout (decision α) eliminates the z-index / overlap class entirely — much better than padding-fudge alternative.
- Two-tap-arming reuses standard CSS variables — no new theme tokens needed (modulo the contrast issue).
- `pointer-events: none` on footer with auto on the link (App.svelte:51,59) — already a defensive layer for the brief moment between view transitions.
- Brainstorm decisions all honored, including the "last wins" semantic for arrows.

## Recommended Actions (priority order)

1. Fix `.game` min-height interaction with `#app` padding (High #1) — gate to coarse pointer or use `100%`.
2. Address armed-button contrast with stronger danger token or white-on-darker-red (High #2).
3. Re-measure and adjust `computeTileSize` margin to ~260–280 OR refactor to measure dock height (Medium #4).
4. Decide and document multi-touch behavior in source (Medium #1).
5. Optionally restore keyboard activation on arrow buttons (Medium #2).

## Metrics

- LOC net: +~110 / −~30
- Files changed: 3
- Build: not run (review only — recommend `pnpm build` smoke-test before commit)
- Lint: not run

## Unresolved Questions

- Is the multi-touch "release-of-finger-2-cancels-finger-1" semantic intentional, or just an implementation artifact? Brainstorm doc says "last wins" for press but doesn't address release.
- Has the dock height been measured on a real iPhone with 34px home-indicator inset? The 220 margin in `computeTileSize` smells low.
- Is there an a11y target (AA / AA-large / no target) for this project? Affects whether the contrast finding is blocking.

**Status:** DONE_WITH_CONCERNS
**Summary:** Implementation is sound and honors plan; two real issues (page-scroll bug from `min-height: 100dvh`, WCAG-AA fail on armed RESET) should land before commit.
