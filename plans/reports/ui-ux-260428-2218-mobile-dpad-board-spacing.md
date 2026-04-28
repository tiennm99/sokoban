# Mobile D-pad / Board Spacing Review

**Date:** 2026-04-28
**Scope:** Vertical gap between puzzle board and on-screen controls on touch devices.
**Verdict:** "Too far" gap is real. Two compounding causes: (1) `#app` flex-centering creates dead space below short puzzles, (2) parent `.game` `gap: 16px` + `.mobile-dock` bottom safe-area padding are both spent in the same seam. No single value is huge; the stack adds up.

---

## 1. Measured spacing stack (top->bottom, mobile)

From CSS only, in source order, between bottom of board and bottom of viewport:

| Source | Selector | Value | Notes |
|---|---|---|---|
| Container padding | `#app { padding: 24px }` | 24px bottom | global, both axes |
| Container centering | `#app { align-items: safe center }` | variable | distributes free space ABOVE+BELOW `.game`. With `.game` short, splits leftover space. With `.game` stretched (`align-self: stretch`), no extra centering — but `.game` height is content-driven inside flex column |
| Flex row gap | `.game { gap: 16px }` | 16px | between every child: hud->board->dock |
| Board wrap padding | `.board-wrap` | 0 | none defined |
| Inner gap | between `.board-wrap` and `.mobile-dock` | 16px | from `.game` gap |
| Dock top padding | `.mobile-dock { padding: 0 ... }` | 0 top | only side+bottom padded |
| Dock bottom padding | `.mobile-dock { padding-bottom: 12px + safe-area }` | 12px + inset | inset typically 0-34px depending on device |
| App bottom padding | `#app { padding: 24px }` | 24px bottom | applies AFTER dock |

**Key insight:** the seam between board and D-pad is exactly **16px** (the `.game` gap). That is fine — not the source of "too far".

The real culprits are below the dock and above-from-board:

- `.mobile-dock` bottom padding `12px + env(safe-area-inset-bottom)` -> 12-46px on iOS.
- `#app` bottom padding `24px` -> ALWAYS applied even when dock is at bottom.
- Total below-dock dead band: **36-70px** depending on device.
- `#app`'s `align-items: safe center` on the cross-axis is irrelevant here (column flex, axis is horizontal). On the main axis (`justify-content: center`), `.game` with `align-self: stretch` plus `.board-wrap { flex: 1 }` should fill — but only if `.game` itself stretches vertically. It does NOT: `#app` is `min-height: 100vh` flex with `justify-content: center` (default `flex-start` actually — `#app` has no explicit `justify-content`, only `align-items: safe center`). Let me re-check.

### `#app` re-read

```css
#app {
  min-height: 100vh;
  display: flex;
  justify-content: center;   /* main axis: horizontal — centers .game horizontally */
  align-items: safe center;  /* cross axis: vertical — centers .game vertically */
  padding: 24px;
}
```

Default `flex-direction: row`. So:
- main axis = horizontal -> `justify-content: center` centers .game left/right. Fine.
- cross axis = vertical -> `align-items: safe center` vertically centers `.game` IF its content is shorter than `#app`. **This is the dead-space culprit.**

`.game` has `align-self: stretch` (set in GameView), which on the cross axis OVERRIDES `align-items` and stretches `.game` to full `#app` height. Good — so vertical centering shouldn't apply.

But: `.game` uses `display: flex; flex-direction: column; gap: 16px` with NO `flex: 1` on children except `.board-wrap`. That means:
- HUD takes natural height.
- `.board-wrap` is `flex: 1 1 auto` -> fills remaining.
- `MobileControls` takes natural height.

**Inside `.board-wrap`:** the `<Board>` is a fixed-pixel `<div>` (width/height = `level.width * tileSize`, `level.height * tileSize`), NOT centered. `.board-wrap` is `overflow: auto`. The board renders at top-left of `.board-wrap`. For short puzzles the wrap is taller than the board, leaving **whitespace BELOW the board, INSIDE `.board-wrap`**. This is the visible "too far" gap on small puzzles like Microban 1 (8x6).

That dead space is invisible (same dark gradient as `.board-wrap` background = transparent over body bg) and exactly the size of `(.board-wrap height - board height)`.

**This is the dominant cause of the user complaint.** Not a margin, not safe-area — it's the un-centered board sitting at the top of a flex-grown wrapper.

---

## 2. Cause ranking

1. **PRIMARY: `.board-wrap` is flex:1 with the `<Board>` unanchored.** Short puzzles render top-aligned; everything below the board down to the dock is unused. Often 100-300px on phones.
2. **SECONDARY: `#app { padding: 24px }` applies on mobile.** 24px below the dock plus 12px dock padding plus safe-area = a thick band beneath controls. On a 6.1" phone that's ~50-70px of empty under the D-pad. Doesn't separate dock from board, but eats vertical real estate that could let the board be larger (and thus the dock visually closer via larger tiles).
3. **TERTIARY: `.game { gap: 16px }`** — fine on desktop, slightly generous on phones. 12px would tighten the hud->board->dock rhythm.
4. **QUATERNARY: `computeTileSize`'s `margin = 220` on coarse pointers.** This reserves vertical for header+hud+dock+padding. The dock is ~120px tall (2 grid rows of 56px + 4px gap + 12px+inset bottom padding). Hud ~60px. App padding 48px (top+bottom). 220px is roughly correct, maybe 20px too generous, which slightly shrinks the board and visually lengthens the gap below it.

---

## 3. Recommended changes (concrete, gated)

All recommendations are **`@media (pointer: coarse)`** only. No desktop regressions.

### R1 — Anchor the board to the bottom of `.board-wrap` (HIGHEST IMPACT)

**File:** `src/views/GameView.svelte`
**Change:**
```css
@media (pointer: coarse) {
    .board-wrap {
        display: flex;
        align-items: flex-end;        /* board hugs dock side */
        justify-content: center;       /* still horizontally centered */
    }
}
```
This places the board's bottom edge against the top of the dock seam (with the existing 16px `.game` gap). Visually closes the largest dead band on short puzzles.

**Trade-offs:**
- Board moves DOWN as user scrolls level select / new level. Slight visual jump at level transition. Acceptable.
- For very tall puzzles that already overflow, `align-items: flex-end` interacts with `overflow: auto`: scrolling continues to work because the inner `<Board>` is fixed-size, but the initial scroll position lands at the bottom. **Mitigation:** Use `align-items: end` only when board fits — or accept the bottom-anchored scroll start (probably fine, players see the player at start anyway since most maps fit). If problematic, alternative R1b below.

**Alternative R1b (safer on tall puzzles):** instead of flex-end, use `margin-top: auto` on the inner `.board` only when it fits. This requires container query support OR a JS-set class. R1 simpler; recommend R1 first.

### R2 — Trim global app padding on mobile

**File:** `src/app.css`
**Change:**
```css
@media (pointer: coarse) {
    #app {
        padding: 12px 12px 0;   /* dock owns its own bottom padding via safe-area */
    }
}
```
- 12px lateral instead of 24px (more board room, also feels modern).
- 0 bottom: `.mobile-dock` already pads `12px + env(safe-area-inset-bottom)`. Doubling was wasteful.
- Keep 12px top so the HUD doesn't kiss the notch on landscape.

**Trade-offs:**
- Slightly tighter horizontal margin around the board on small screens. Acceptable; game already uses `max-width: calc(100vw - 48px)` on `.board-wrap`. **Update that too:**
```css
@media (pointer: coarse) {
    .board-wrap { max-width: calc(100vw - 24px); }
}
```
- Bumping `computeTileSize` width margin from 80 to 40 in mobile branch is the JS counterpart (optional follow-up; current CSS will gracefully overflow-scroll).

### R3 — Tighten the column rhythm

**File:** `src/views/GameView.svelte`
**Change:**
```css
@media (pointer: coarse) {
    .game { gap: 10px; }
}
```
- 16px -> 10px between hud/board/dock. Saves 12px total vertical and visually couples controls to board.
- Don't go below 8px — touch users need a clear visual seam so they don't tap the board edge thinking it's a button.

### R4 — Slim the dock's vertical footprint

**File:** `src/views/MobileControls.svelte`
Two minor knobs:

```css
@media (pointer: coarse) {
    .mobile-dock {
        padding:
            0
            calc(8px + env(safe-area-inset-right))
            calc(6px + env(safe-area-inset-bottom))
            calc(8px + env(safe-area-inset-left));
    }
    .dpad {
        grid-template-columns: 52px 52px 52px;
        grid-template-rows: 52px 52px;
    }
    .action {
        height: 40px;            /* still >= 40px, MD spec; keep min-tap area via padding */
        min-width: 56px;
    }
}
```
- 56->52px arrows = 8px less dock height. Still well above 48x48 effective tap area thanks to the `pointerdown` handler firing across the full button border-box. Apple HIG min is 44pt.
- 44->40px action button height. **Borderline** — keep at 44px if you want to be conservative; arrow shrink alone saves enough.
- 12->6px dock bottom padding. Safe-area inset still honored.

**Trade-offs:**
- 52px arrows are still fat-finger-friendly; Mobbin samples (Supercell, Playdots, Apple Maps reroute UI) routinely use 48-52px primary controls.
- Action height 40px is the riskier change. **Recommendation:** keep 44px; only shrink arrows.

### R5 — One-handed reachability nudge (optional, lower priority)

After R1-R4 the dock is closer. To further improve thumb travel for right-handed users (statistically dominant), no layout change needed — current `.dock-left` (actions) on left, `.dpad` on right is already the right-handed default. Left-handed players need a settings toggle later (out of scope).

---

## 4. Recommended order of application

Cheapest -> most behavioral:

1. **R3** (`.game` gap 16->10 on coarse) — 1 line, instant 12px win.
2. **R2** (`#app` padding trim) — 1 rule, ~24px win, also enlarges board.
3. **R1** (`.board-wrap` flex-end anchoring) — biggest perceptual win on short puzzles, slight scroll-start change on tall ones.
4. **R4 partial** (arrows 56->52 only, leave action height 44) — 8px more, low risk.

Skip R5 for this round. Re-measure after R1-R3.

---

## 5. UX trade-off summary

| Change | Reach win | Risk |
|---|---|---|
| R1 anchor board bottom | High — closes dead band on short puzzles | Tall puzzle initial scroll lands at bottom (player still visible since players spawn near targets) |
| R2 #app padding | Medium — gains height for tile-size calc, less padding under dock | Slightly less breathing room around board on landscape |
| R3 gap 10px | Low-medium — tightens rhythm | Could feel cramped if HUD wraps; HUD `flex-wrap: wrap` already handles |
| R4 arrows 52px | Low — 8px | Slight reduction in fat-finger forgiveness; still > 44pt min |
| R4 action 40px | Low | Borderline a11y, NOT recommended |

---

## 6. Accidental-tap analysis near board edge

Current: 16px gap between board and dock. Board's last-row tiles are tappable surface in some Sokoban games but here `<Board>` has no click handlers — only the D-pad moves the player. So no risk from R1 (anchoring board next to dock). The gap can shrink to 10-12px without functional risk. Visual seam still visible because dock has a different background tone (`var(--panel)` vs board's `var(--bg-deep)`).

---

## 7. Quick numerical example (Pixel 7, 412x915, no safe-area inset)

Before (current):
- `#app` padding 24+24 = 48
- HUD ~52
- `.game` gap 16+16 = 32
- Dock 56+4+56 + 12 bottom = 128
- Board area: 915 - 48 - 52 - 32 - 128 = **655px** vertical for `.board-wrap`
- Microban 1 (6 tiles tall) at tile=56 -> board height 336px
- Dead space below board inside `.board-wrap`: **655 - 336 = 319px**

After R1+R2+R3:
- `#app` padding 12+0 = 12
- HUD ~52
- `.game` gap 10+10 = 20
- Dock 56+4+56 + 6 bottom = 122
- Board area: 915 - 12 - 52 - 20 - 122 = **709px** -> tile recomputes up to 56 cap, board still 336 because cap binds
- With R1 (flex-end), dead space 709-336 = 373px **moves above the board** so the seam between board and dock is now ~10px.

Visual gap reduction at the seam: **~329px** (from 319+10 to 10). Massive.

---

## 8. Files to touch (when approved)

- `src/app.css` — R2 (mobile #app padding override).
- `src/views/GameView.svelte` `<style>` — R1 (board-wrap anchoring), R3 (.game gap on coarse).
- `src/views/MobileControls.svelte` `<style>` — R4 partial (arrow size, dock bottom padding) — optional.

No JS changes required if R4 limited to arrow size. If `computeTileSize` margin is also tuned, that's a follow-up tweak inside `GameView.svelte` script (lower 220 -> ~195 on coarse).

---

## Unresolved questions

1. **Tall puzzle scroll behavior with R1:** confirm whether starting scrolled-to-bottom on the two giant finale levels feels disorienting. May want `scroll-snap-align: end` on `.board` plus initial `scrollTop = scrollHeight` only when board > wrap.
2. **Should action stack height also shrink (R4 full)?** Borderline a11y vs gain. Recommend keeping 44px unless the user explicitly wants tighter.
3. **Hide HUD on touch devices when board needs space?** HUD wraps on narrow screens — could collapse stats into a single line or move best-moves into the win dialog only. Out of scope for this report but flag for next round.
4. **Landscape orientation:** dock is 2-column row, but on landscape phones (height ~412) the layout breaks down differently. Have not measured. Worth a follow-up if telemetry shows landscape use.
