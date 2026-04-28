# Portrait + Landscape Mobile Layout Brainstorm

Date: 2026-04-28
Scope: Diagnose perceived "stuck-to-bottom" portrait layout. Recommend landscape strategy. KISS, no framework deps.

## Research (mobile puzzle/grid games)

Quick scan (Game UI DB, Touch Control Design refs). Common landscape patterns for grid/puzzle:

- **Side-anchored controls.** Console-emulator UX: D-pad bottom-left, action buttons bottom-right, board fills middle. Standard for two-handed grip.
- **Two-column split.** Board left/center, control panel pinned right (or both sides). Used by mobile chess apps, turn-based puzzles, Slay the Spire.
- **Hide HUD / collapse.** Mini Metro, 2048 mobile: shrink stats to a corner, give 90%+ of viewport to play area.
- **Lock to portrait.** Threes, Monument Valley, most match-3. Cheapest UX. Acceptable when portrait is the canonical experience.
- **Floating overlay controls.** Touch fighters, Dead Cells mobile: semi-transparent buttons over the board.

Sokoban specifically: most ports either lock portrait or require swipe-on-board input (no on-screen d-pad), avoiding the layout problem entirely. Side-anchored controls are the conventional landscape answer when a d-pad is mandatory.

## Problem A: Portrait diagnosis

### Flex math (Pixel 7 412x915, Microban 1 = 8w x 6h, coarse)

- `computeTileSize`: `maxByW = (412-80)/8 = 41`, `maxByH = (915-195-100)/6 = 103`, `tile = min(56,41,103) = 41`.
- Board renders 8x6 at 41px = `328 x 246`.
- `#app` coarse padding `12px 12px 0`. HUD wraps to ~52px (level-name 22 + stats 14 + minor gap).
- `.game` has `gap: 10px` (coarse).
- `.play-stack` available height: `915 - 12(top pad) - 52(hud) - 10(gap) = 841px`.
- `.play-group` content: `246 (board) + 8 (gap) + ~110 (dock: 48+6+48 arrows + 20px bottom inset, no top padding)` = **364px**.
- `safe center` puts group at top margin `(841-364)/2 = 238.5px`.
- Group **bottom** sits at `12+52+10+238.5+364 = 676.5px` from top → **238.5px gap** to viewport bottom.
- Group **center** at y=494.5; viewport center at y=457.5. Group center is **37px BELOW** viewport center.

**Verdict: not glued to bottom.** Centering works. But group is *slightly* below true viewport center (~37px) because `.play-stack` starts after HUD+padding (the *available stack*, not the viewport, is what's centered). Combined with empty space *below* the group (238.5px) being symmetric to space *above the stack-content* (238.5px) but **asymmetric to total above-group whitespace** (12+52+10+238.5 = 312.5px), the *negative space* feels heavier above → eye reads group as "lower middle".

### Why user perceives bottom-anchored

Three real factors:
1. **HUD whitespace dominates the top.** 52px HUD + 10px gap reads as "small" content; the remaining 312px of upper void looks empty. Below the group, only 238px of void. Top void > bottom void by 74px → group leans visually low.
2. **Bottom-clinging dock.** The d-pad+actions are visually heavier than the board (high-contrast borders, 48px buttons, dense). User's eye latches onto them; they're 110px from `safe-area-inset-bottom`+padding. Heavy element near bottom → "anchored".
3. **`safe-area-inset-bottom` (20px) is part of the dock**, not external margin. So the *visible* gap dock-to-screen-edge equals exactly the safe area + the 238.5px symmetric center distance — but on devices without a home indicator, only the 20px reads as the perceived bottom gap once you discount the centering whitespace as "page padding".

Wait — **re-read math**: 238.5px IS the bottom void. So dock bottom-edge sits 238.5px above viewport bottom. That's *not* anchored. The user's complaint is likely about **(1)** top void being noticeably larger than bottom void.

### Portrait fix options

| Option | Change | Effect | Cost |
|---|---|---|---|
| **A. Status quo** (centered) | none | Geometry-correct center; visual center reads "low" due to HUD top-weight | 0 |
| **B. Bias toward upper-third** (golden ratio) | replace `safe center` with `flex-start` + dynamic top spacer ~30% of free space | Group sits in visually-balanced "comfortable reading" zone; matches phone reading habits | low |
| **C. Anchor lower-third (thumb zone)** | `justify-content: flex-end` + bottom margin ~80px | Dock lands in primary thumb-reach zone (Steve Hoober's thumb-zone research); board sits comfortably above it | low |
| **D. Hybrid bias** | `safe center` + `padding-top: 0; padding-bottom: clamp(8px, 8vh, 80px)` to pull center upward | Cheapest visual bias; preserves overflow scroll behavior | minimal |

**Recommendation A→D:** Add a single `padding-bottom` (or `margin-bottom`) on `.play-group` (or asymmetric padding on `.play-stack`) that is *consumed by `safe center`*. Net effect: centroid shifts up by half the bias. ~16-24px is enough for the perceptual difference without breaking tall-puzzle overflow.

If user actually wants thumb-zone anchoring (option C), that's a separate UX decision — reasonable for a one-handed puzzle but contradicts "centered group" goal of commit `16520d1`. **Ask user before implementing C.**

## Problem B: Landscape diagnosis

### Math (Pixel 7 landscape 915x412, Microban 1)

Current layout (single column):
- `tile = min(56, (915-80)/8=104, (412-195-100)/6=19) = 19` → board **152 x 114px**. Tiny.

Microban 145 (~19w x 16h):
- portrait: tile 17 → 323x272 (workable).
- landscape current: `min(56, 43, 7) = 7` → **133x112**. Unplayable.

Root cause: vertical chrome reserve (195px) + dock (102px) + HUD (~52px) consumes ~349 of 412px viewport. Only 63px left for board height. `computeTileSize` is stacking chrome optimised for portrait.

### Strategies

#### S1 — Side-by-side (board left, controls right column)

- **Markup:** wrap `.play-group` contents in a row at landscape; OR add `@media (orientation: landscape) and (pointer: coarse)` that flips `.play-group` to `flex-direction: row`. Reorder so dock is right.
- **`computeTileSize`:** detect orientation; in landscape, `margin = 76` (HUD ~52 + padding ~24, no dock vertical reserve), `maxByW = (window.innerWidth - 80 - 160) / level.width` (160 = right dock width incl gap).
- **Math (Microban 1 landscape):** `tile = min(56, (915-80-160)/8=84, (412-76)/6=56) = 56`. Board **448x336**. **3x bigger.**
- **Math (Microban 145):** `tile = min(56, 36, 21) = 21` → 399x336.
- **Controls:** dock becomes `flex-direction: column`; action stack on top, d-pad on bottom (or vice versa). Both columns ~150-160px wide. Touch targets unchanged (still 48px).
- **HUD:** stays top, full-width.
- **Risks:** need to choose which side gets d-pad (right-handed default = right). Lefties suffer. Action buttons & d-pad must both fit vertically: 110px (action grid 2 rows) + gap + 110px (d-pad 2 rows) = ~232px > 412-52-24 = 336px available. Fits comfortably.
- **Trade-off:** moderate CSS work + small JS change (orientation-aware `computeTileSize`).

#### S2 — Bottom controls + aggressive HUD shrink

- **Markup:** none.
- **`computeTileSize`:** in landscape, shrink HUD vertical to ~28px (single line, smaller font), drop `.game` gap, reduce dock vertical (maybe shrink arrows to 40px in landscape). New margin maybe ~150.
- **Math (Microban 1):** `tile = min(56, 41, (412-150-100)/6=27) = 27`. Board 216x162. Better than 19 but still cramped.
- **Trade-off:** preserves portrait code path; minimal change. But violates HIG 44pt minimum if shrinking arrows. Net win < S1.

#### S3 — Lock to portrait

- **Markup:** none. Add `<meta name="screen-orientation" content="portrait">` (limited support) OR JS `screen.orientation.lock('portrait')` on game start (only PWA/standalone).
- **CSS-only fallback:** detect landscape via `@media (orientation: landscape) and (pointer: coarse)`, show "rotate device" overlay covering viewport.
- **Trade-off:** zero layout work. Acceptable if landscape isn't a target experience. Frustrating for users with locked-orientation phones in landscape mounts. **Cheapest. Honest.**

#### S4 — Floating overlay controls

- **Markup:** `.mobile-dock` becomes `position: fixed`; d-pad bottom-right, actions top-right (or bottom-left).
- **Board:** fills entire viewport behind, no chrome reserve.
- **`computeTileSize`:** strip dock from margin; only HUD reserve ~52.
- **Math (Microban 1 landscape):** `tile = min(56, 104, 60) = 56` → 448x336 board fills perfectly.
- **Risks:** controls overlap board on small puzzles (boxes/player obscured). Semi-transparent helps but reduces tap clarity. HUD overlap on tall puzzles. Z-order debugging. Most engineering risk.
- **Trade-off:** maximises board real estate but compromises tap clarity and board legibility.

### Comparison

| Axis | S1 Side-by-side | S2 Bottom+shrink | S3 Lock portrait | S4 Floating |
|---|---|---|---|---|
| Board size win (Microban 1 landscape) | 56px tile (3x) | 27px tile (1.4x) | n/a | 56px tile (3x) |
| CSS LOC change | ~30 | ~15 | ~10 (overlay) | ~25 |
| JS LOC change | ~10 (orientation reactive) | ~5 | 0 | ~5 |
| Touch target safety | preserved | risk if shrunk | preserved | preserved |
| HUD visible | yes | yes (smaller) | n/a | yes (or overlap risk) |
| Engineering risk | low | low | very low | medium (overlap/z-order) |
| Reversibility | easy | easy | easy | easy |

## Recommendations

### Portrait: keep `safe center`, add small downward bias to top of stack (Option D)

Cheapest meaningful win. Add to coarse media query:

```css
.play-stack { padding-top: 0; padding-bottom: clamp(16px, 6vh, 56px); }
```

Net: `safe center` of remaining stack distributes the 56px asymmetric padding into the centroid → group rises by ~28px. Preserves overflow scroll, no markup change. Verifies user complaint "feels low" without inventing a new model.

**Alternative if user actually means thumb-anchored:** Option C (`justify-content: flex-end` + 80px bottom margin). Diverges from commit `16520d1` philosophy. **Confirm intent with user before picking C over D.**

### Landscape: S1 Side-by-side

Three reasons:
1. **3x board size** for Microban 1; massive UX win exactly where user complained.
2. **Conventional pattern** (matches console-emulator + Game UI DB landscape conventions). No re-training needed.
3. **Preserves all recent fixes** (mistouch, top-aligned d-pad, LVLS grid) — they're internal to MobileControls. Only the dock's *outer* `flex-direction` flips. Action grid `grid-template-columns: auto auto` and d-pad grid both work as columns when their parent is row.

Implementation outline (no code, per request):
- New media query: `@media (pointer: coarse) and (orientation: landscape)`.
- `.play-group { flex-direction: row; align-items: stretch; }`.
- `.mobile-dock { flex-direction: column; width: ~150px; gap: 16px; }` (stack action grid above d-pad, or reverse).
- `.dock-left { align-self: stretch; }` and `.dpad { align-self: stretch; }`.
- `computeTileSize` reads `window.matchMedia('(orientation: landscape)').matches`; in landscape, use `margin = 76` and reserve `dockWidth = 160` from `maxByWidth`.
- Add resize/orientationchange recompute (already wired via `onResize`; just ensure `matchMedia` listener fires too).

If S1 feels heavy, fall back to **S3 (lock portrait)** as a 10-minute escape hatch. Only choose S2 if user wants bottom-only consistency. Avoid S4.

### Orientation detection mechanism

**Recommend `@media (orientation: landscape)` (CSS) + `window.matchMedia('(orientation: landscape)')` (JS).**

Reasons:
- **Native semantic.** Browser reports actual orientation, not aspect ratio (which gets weird on foldables/landscape-narrow tablets).
- **Reactive.** `MediaQueryList` fires `change` event on rotate; mirrors existing `pointer: coarse` listener pattern in `GameView.svelte` (line 134).
- **Single threshold.** `aspect-ratio` queries need tuning per-device; orientation is binary.
- Avoid mixing `max-aspect-ratio` unless we hit a specific edge case (e.g. iPad split-screen) — YAGNI.

Existing code already uses `matchMedia` for pointer; same pattern extends cleanly.

## Constraints check

- Touch ≥44pt: preserved in S1 (48px arrows untouched, just rearranged column).
- No reverts: c80b9ce + 18d63d0 + 179f052 + 16520d1 all internal/portrait → unaffected by S1's outer-direction flip.
- No new deps: pure CSS + 5-10 LOC JS in `computeTileSize`.

## Unresolved questions

1. **Portrait intent:** does user want geometry-centered (current, math is right) with a small upward bias (option D), or thumb-zone-anchored (option C)? Brainstorm leans D; C is a different UX goal.
2. **Landscape dock side:** right side (right-handed default) or split (d-pad left, actions right)? Split is more ergonomic for two-handed grip; single-side is simpler. Recommend single-side right; revisit if lefties complain.
3. **Hide HUD entirely in landscape?** If S1 reaches Microban 145 tile=21 (workable but tight), shrinking HUD to a single 28px row buys ~24px more vertical → tile 22-23. Worth it? Probably not; HUD content (level name + moves + best) is gameplay-relevant.
4. **Lock landscape only on tiny levels?** Conditional layout per level dimensions = over-engineering. Reject (YAGNI).
5. **Action stack vs d-pad order in landscape column:** d-pad on top (closer to natural eye landing) or actions on top? D-pad-bottom matches portrait habit; d-pad-top mirrors a console face-button cluster. Recommend d-pad-top (eyes go right → see arrows first).

Sources:
- [Touch Control Design: Ways Of Playing On Mobile — Mobile Free To Play](https://mobilefreetoplay.com/control-mechanics/)
- [Game UI Database](https://www.gameuidatabase.com/)
- [Mobile Controls | Game UI Database 2.0](https://www.gameuidatabase.com/index.php?scrn=147)
- [Designing For Device Orientation: From Portrait To Landscape — Smashing Magazine](https://www.smashingmagazine.com/2012/08/designing-device-orientation-portrait-landscape/)
- [App orientation, aspect ratio, and resizability | Android Developers](https://developer.android.com/develop/ui/compose/layouts/adaptive/app-orientation-aspect-ratio-resizability)
