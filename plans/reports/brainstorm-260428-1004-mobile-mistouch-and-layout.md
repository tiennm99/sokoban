---
title: Mobile Mistouch & Layout Fix — Brainstorm
date: 2026-04-28
slug: mobile-mistouch-and-layout
related:
  - reports/ui-ux-260428-0935-mobile-footer-mistouch.md
status: design-approved
---

# Mobile Mistouch & Layout Fix

## Problem

Mobile users report:
1. Mistouches on `miti99.com` footer link during gameplay.
2. (Surfaced in this session) D-pad / action stack overlap the board view on small viewports.

Footer review report (`ui-ux-260428-0935-mobile-footer-mistouch.md`) covers root cause: fixed footer link sits in same band as D-pad with sub-WCAG hit area.

## Decisions (user-approved)

| # | Decision |
|---|----------|
| D1 | Footer: hide on game view only. Visible on Menu + Level Select. |
| D2 | Add `env(safe-area-inset-bottom)` to footer offset on screens where it remains. |
| D3 | Reset button gains confirm step (no more one-tap destructive wipe). |
| D4 | D-pad gains press-and-hold repeat (parity with keyboard's REPEAT_MS=130). |
| D5 | D-pad/action stack must not overlap the board view. |
| D6 | Create implementation plan first (not direct implement). |

## Layout root cause (D5)

`MobileControls.svelte` uses `position: fixed; z-index: 50` for both dock-left and D-pad.
`GameView.svelte` `.board-wrap` reserves vertical space via `max-height: calc(100vh - 260px)` on `(pointer: coarse)` — but `overflow: auto` means tall puzzles scroll **under** the fixed D-pad. Width is unconstrained — board content can sit horizontally beneath the corner-pinned dock.

`computeTileSize` margin=260 sizes tiles to fit, but if viewport is small enough or aspect ratio awkward, scroll regions appear and the floating dock visually covers them.

## Approach options for D5 (layout)

### α — In-flow controls (recommended)
Convert MobileControls from `position: fixed` into a normal grid/flex row at the bottom of `.screen.game`. Board-wrap becomes the flex-grow child, dock occupies its own row.

- **Pros:** zero overlap by construction. Browser handles z-index, scroll, safe-area naturally. Future-proof.
- **Cons:** more layout refactor (GameView CSS changes). Need to ensure dock-left + D-pad row fits on one line on narrow phones (~360px) — likely fine since dock-left is column-stacked, D-pad is the wider element.

### β — Fixed + page padding
Keep fixed positioning, add `padding-bottom: calc(260px + safe-area)` to `.screen.game` and remove `max-height` clamp from board-wrap. Scroll body, not board.

- **Pros:** smaller diff. No structural change.
- **Cons:** still uses fixed dock — page scrolling on iOS tends to fight gesture-blocking. Tile size calc still needs the 260 reserve. Doesn't fix the conceptual smell.

### γ — Hybrid: fixed dock + spacer div
Keep dock fixed, insert a flex spacer with matching height inside `.screen.game` to push board upward. Equivalent visually to α with less refactor risk.

- **Pros:** middle ground. Dock stays in its corner.
- **Cons:** spacer is dead markup. Two sources of truth for dock height.

**Pick α.** KISS+YAGNI: stop fighting fixed positioning, put the dock where it belongs — in the document flow.

## Approach options for D3 (Reset confirm)

### a — Two-tap arming (recommended for mobile)
First Reset tap arms the button (label changes "RESET" → "TAP AGAIN"), 2-second timeout to disarm. Second tap actually resets.

- **Pros:** zero modal infra, no z-index war. One file change. Short interaction.
- **Cons:** discoverability (user must learn the pattern). Mitigated by visible label change.

### b — Confirm modal
Reuse existing dialog component. Yes/Cancel.

- **Pros:** explicit, no learning curve.
- **Cons:** heavier interaction, modal infra already used by win + donate. Overkill for "are you sure?"

### c — Long-press to reset
Tap = no-op; long-press (500ms) = reset.

- **Pros:** native gesture, no UI change.
- **Cons:** undiscoverable. Conflicts with mobile gesture-blocking. Reject.

**Pick a.** Two-tap arming.

## Approach options for D4 (D-pad hold-repeat)

### i — pointerdown + setInterval (recommended)
On `pointerdown`, fire move immediately, start `setInterval(REPEAT_MS=130)` until `pointerup` / `pointercancel` / `pointerleave`. Uses Pointer Events for unified mouse+touch.

### ii — touchstart-only
Same logic but touch-only events. Misses mouse users on hybrid devices (Surface, iPad+trackpad).

**Pick i.** Pointer Events covers all coarse-pointer cases.

## Approach for D1+D2 (footer)

Single conditional in `App.svelte`:

```svelte
{#if view !== 'game'}
  <footer class="site-footer">…</footer>
{/if}
```

Add `bottom: calc(6px + env(safe-area-inset-bottom));` to `.site-footer` for menu/levels screens.

## Files affected

| File | Change |
|------|--------|
| `src/App.svelte` | conditional footer + safe-area inset |
| `src/views/GameView.svelte` | layout refactor: board-wrap grows, dock occupies bottom row; update `computeTileSize` margin if needed |
| `src/views/MobileControls.svelte` | drop `position: fixed`; add hold-repeat to arrow buttons |
| `src/views/AppButton.svelte` or new mini state | possibly armed-state styling for Reset (or inline in MobileControls) |

## Risks

- Layout refactor may regress portrait/landscape edge cases on iPad. Mitigation: manual smoke test 360×640, 414×896, 768×1024.
- Hold-repeat with box-pushing could feel violent if too fast. Mitigation: reuse REPEAT_MS=130, same as keyboard.
- Reset arming-state UX needs clear visual delta. Mitigation: color/icon swap, not just text.

## Success criteria

- Cannot tap miti99 link during gameplay.
- D-pad never visually overlaps board content at common phone sizes (360–430 wide).
- Reset requires two taps within 2s window.
- Holding a D-pad arrow continuously moves the player at keyboard parity.
- Footer respects safe-area-inset on iPhone X+ home-indicator.
- Build passes; no console errors on touch devices.

## Out of scope

- Sound effects (Phase 4).
- Player facing direction (Phase 4).
- Level category tabs (Phase 4).

## Open questions

(none — all clarifications resolved during AskUserQuestion round)

## Next step

Invoke `/ck:plan` with this report as context to produce phased implementation plan in `plans/260428-1004-mobile-mistouch-fix/`.
