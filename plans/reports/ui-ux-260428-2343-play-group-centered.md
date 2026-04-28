# Play-Group Centered Layout (in-game view)

Date: 2026-04-28
Scope: coarse-pointer (touch) layout of `GameView`. Make `[board + small gap + controls]` a single grouping div, vertically centered between HUD and viewport bottom.

## Brainstorm

Considered three approaches:

1. **Wrapper + flex `justify-content: safe center`** (chosen). New `.play-stack` parent fills space below HUD; inner `.play-group` holds Board + MobileControls with a small gap. Parent uses `safe center` so tall puzzles fall to start instead of clipping under the HUD.
2. **CSS Grid `1fr / auto / 1fr` rows.** Awkward — board+controls must stay one contiguous unit; would need a sub-wrapper anyway, redundant with strategy 1.
3. **`margin: auto 0` on the group.** Works for centering but interacts poorly with internal scroll on tall puzzles (margins collapse, scroll target unclear).

Chose 1: idiomatic, pure CSS, handles overflow gracefully via `safe center` (modern browsers fall back to `flex-start` when content exceeds container).

**Coarse-only.** Desktop has no MobileControls visible; centering would only affect the lone board, which is already handled by `#app { align-items: safe center }`. Universal change risks desktop regression for no UX win.

**Gap = 8px.** Tight enough to read as a single grouped unit; distinct from internal control gap (6px).

## Files touched

- `src/views/GameView.svelte` — wrapped `<Board>` + `<MobileControls>` in `.play-stack > .play-group`. Replaced coarse `.board-wrap { align-items: flex-end }` with new `.play-stack { justify-content: safe center }` + `.play-group { gap: 8px; max-height: 100% }`. Kept `.board-wrap` desktop rule (flex-grow within group); coarse adds `display: flex; justify-content: center` for horizontal centering.
- `src/views/Board.svelte` — removed obsolete coarse `.board { margin-top: auto }` rule (was a belt-and-suspenders for the prior `align-items: flex-end` strategy, now redundant).

No JS changes. No new files. `computeTileSize()` margin (195 coarse / 120 desktop) untouched — total reserved chrome unchanged.

## CSS diff highlights

Before (coarse):
```css
.board-wrap {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    max-width: calc(100vw - 24px);
}
/* + .board { margin-top: auto } in Board.svelte */
```

After:
```css
/* universal */
.play-stack { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.play-group { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }

/* coarse */
.play-stack { justify-content: safe center; }
.play-group { flex: 0 1 auto; gap: 8px; max-height: 100%; }
.board-wrap { flex: 1 1 auto; display: flex; justify-content: center; max-width: calc(100vw - 24px); }
```

Key invariants:
- Group holds [board-wrap + 8px gap + dock]. On coarse, `flex: 0 1 auto` lets it shrink to content; `max-height: 100%` keeps it bounded.
- Board scroll preserved: `.board-wrap` keeps `overflow: auto` + `min-height: 0` + `flex: 1 1 auto` (coarse) so it absorbs available space inside the bounded group; tall puzzles scroll inside the wrapper.
- `safe center`: tall puzzles overflowing the parent fall to start (top), preventing clipping above the HUD.

## Build result

`npm run build` clean. CSS bundle 10.33 kB (negligible vs prior).

## Smoke test checklist (manual)

Touch / mobile (or DevTools mobile emulation with `pointer: coarse`):
- [ ] Short Microban level (e.g. level 1): board sits roughly mid-screen; d-pad has small gap below board, not glued to viewport bottom.
- [ ] Medium level: same — group reads as one unit, centered.
- [ ] Tall finale level (Microban 145+): board fills remaining height, scrolls inside its wrapper; controls remain visible at the bottom of the group; no HUD overlap.
- [ ] Rotate to landscape on phone: still centers; tall puzzles still scroll.
- [ ] iPad with `safe-area-inset-bottom`: dock still respects safe area (untouched in MobileControls.svelte).

Desktop / mouse:
- [ ] Game view layout unchanged: HUD top, board fills remaining column area, no MobileControls visible.
- [ ] Board horizontal centering unchanged.
- [ ] Tall level on small browser window: still scrolls.

Regressions to watch:
- [ ] Win overlay still positions correctly (it's `position: fixed`, unaffected).
- [ ] Donate modal still works.
- [ ] Tile-size auto-fit on resize still picks correct value (no margin recompute needed).

## Unresolved questions

- Should the gap be 8px or 6px to match dock internal gap exactly? Picked 8 to read as a deliberate "between two parts" gap rather than continuing the internal grid rhythm. Adjustable in one place (`.play-group { gap }`).
- `max-height: 100%` on `.play-group` — works on tested flex contexts but if user reports edge cases on niche browsers (older Safari), can swap to `min-height: 0; flex: 1 1 auto` (let it grow to fill, accepting the loss of "center when short" in favor of robustness). Current choice prioritizes the requested centering visual.
