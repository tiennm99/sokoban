# Phase 01 — Tighten Mobile Vertical Layout

**Priority:** P1
**Status:** pending
**Mode:** CSS only, gated `@media (pointer: coarse)`. Zero JS, zero markup.

## Context Links

- Review: `plans/reports/ui-ux-260428-2218-mobile-dpad-board-spacing.md`
- Prior fix that established the current flex layout: commit `c80b9ce` (kill footer mistouch / dock-board overlap).
- Footer-on-desktop restore: commit `d5b8aef`.

## Overview

Close the visible "too far" band between board and D-pad on phones by:
1. Anchoring the board to the bottom of `.board-wrap` (R1 — main win).
2. Removing redundant bottom padding on `#app` (R2 — dock owns its own bottom inset).
3. Tightening the `.game` flex gap (R3).

All three are CSS-only and live behind one media query so desktop is untouched.

## Key Insights (from review report)

- Seam between board and dock = exactly `16px` (`.game gap`) — fine on its own.
- Real culprit: `<Board>` is fixed-pixel and renders top-left inside `flex:1` `.board-wrap`. Short puzzles leave **~319px** of invisible dead space *below* the board on a Pixel 7.
- Compounding: `#app` adds 24px bottom padding *under* the dock that already pads `12px + safe-area`.
- Combined fix moves the seam to **~10px**.

## Requirements

**Functional**

- F1. On `@media (pointer: coarse)` the puzzle board's bottom edge sits within ~12px of the dock top edge for puzzles that fit the viewport.
- F2. On `@media (pointer: fine)` (desktop) the layout is pixel-identical to current `main`.
- F3. Tall puzzles still scroll inside `.board-wrap` without overlapping the dock.

**Non-functional**

- N1. No JS changes.
- N2. No new files; edit in place.
- N3. Touch targets unchanged (D-pad arrows stay 56px, action buttons stay 44px).

## Architecture

Affected layers:

```
#app                ← R2 (mobile padding override)
└── .game           ← R3 (mobile gap override)
    ├── .hud
    ├── .board-wrap ← R1 (mobile flex-end anchoring) + max-width tweak
    │   └── <Board>  (fixed-pixel, untouched)
    └── <MobileControls> (.mobile-dock — untouched in this phase)
```

## Related Code Files

**Modify**

- `src/app.css` — add coarse-pointer override on `#app` padding.
- `src/views/GameView.svelte` — add coarse-pointer overrides on `.board-wrap` (flex-end anchoring + max-width) and `.game` (gap 10px).

**Read for context (do not modify)**

- `src/views/MobileControls.svelte` — confirms dock keeps its own `padding-bottom: 12px + env(safe-area-inset-bottom)`.

**Create**

- None.

**Delete**

- None.

## Implementation Steps

### 1. `src/app.css` — R2 mobile padding override

After the existing `#app` rule, add:

```css
@media (pointer: coarse) {
    #app {
        padding: 12px 12px 0;
    }
}
```

Rationale: dock already pads `12px + env(safe-area-inset-bottom)`. Doubling was wasteful. Lateral 12px is plenty around the board.

### 2. `src/views/GameView.svelte` — R1 board anchoring + R3 gap

Inside the existing `<style>` block, append (or merge into the existing `@media (pointer: coarse)` rule that hides `.desktop-actions`):

```css
@media (pointer: coarse) {
    .game { gap: 10px; }

    .board-wrap {
        display: flex;
        align-items: flex-end;
        justify-content: center;
        max-width: calc(100vw - 24px);   /* matches new #app lateral padding */
    }
}
```

Rationale:
- `align-items: flex-end` pins the inner `<Board>` to the bottom edge of the wrapper, so dead space accumulates *above* (invisible behind HUD) instead of *below* (between board and dock).
- `justify-content: center` preserves horizontal centering already implied by `<Board>`'s container; explicit for clarity.
- `max-width` tightens with the new 12px lateral `#app` padding (was 48px-aware).

### 3. Verify build

```bash
npm run build
```

Expect zero errors and similar bundle size.

### 4. Smoke-test in dev server (manual, browser)

```bash
npm run dev
```

Then in DevTools:
- Toggle device toolbar → Pixel 7 (412×915).
- Open Microban 1. Confirm dock sits ~10-16px below board.
- Open a tall finale level (level index 154 — "The Dungeon"). Confirm board scrolls; player visible after initial scroll position settles. If first frame is jarring, log and address in follow-up phase.
- Disable device toolbar → desktop. Confirm pixel-identical layout to pre-change `main` (compare via screenshot or hard refresh).

## Todo List

- [ ] Add `@media (pointer: coarse)` rule to `src/app.css` (R2).
- [ ] Add/merge `@media (pointer: coarse)` rule in `src/views/GameView.svelte` for `.game` gap and `.board-wrap` anchoring (R1 + R3).
- [ ] `npm run build` — must succeed clean.
- [ ] Manual smoke test on Microban 1 (short) + a finale level (tall) via DevTools mobile preset.
- [ ] Manual smoke test on desktop — no regression.
- [ ] Stage + commit (await user instruction).

## Success Criteria

- `npm run build` passes.
- Visual: on coarse-pointer viewport, Microban 1 dock sits within ~16px of board bottom.
- Desktop unchanged.
- No new console warnings.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tall puzzle initial scroll lands at bottom and disorients player | Low-Med | Most levels fit the viewport on phones; for those that don't, player sprite is usually near targets which sit on the board interior. If reports come in, follow-up with `scrollTop = (scrollHeight - clientHeight)` JS only when overflow exists. |
| Landscape orientation regresses | Low | Landscape on phones already has narrow vertical room; `flex-end` still safer than top-aligned. Spot-check during smoke test. |
| Safe-area insets on iOS still leave gap because dock padding compounds | Very low | `padding: 12px 12px 0` keeps top inset; bottom belongs to dock; horizontally we use `12px` literal (no horizontal safe-area inset on most phones in portrait). |

## Security Considerations

None. CSS-only change.

## Next Steps

- Verify visually on a real device (PWA install) once merged.
- If R1 trade-off is felt on tall levels, follow-up phase to apply `align-items: flex-end` only when `.board-wrap` height >= board height (likely needs a small JS class toggle on resize).
- Consider R4 (arrow size 56→52) only if more vertical room is wanted later.

## Unresolved Questions

1. Should we add `scroll-behavior: smooth` on `.board-wrap` to soften the initial bottom-scroll on tall levels? Defer until visual feedback.
2. Action button height — keep 44px (current) or revisit? Out of scope this phase.
