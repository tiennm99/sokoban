# Code-Simplifier Audit — Whole Project

**Date:** 2026-04-27
**Scope:** src/, vite/, index.html
**Mode:** Proposals only — no edits made.

## Summary

Codebase is already lean and idiomatic Svelte 5. Most files honor KISS/YAGNI well. Found ~12 small simplifications, mostly DRY (CSS reset duplication), 1 minor dead-code, 1 minor stale-state bug, 0 architectural issues. **BoardModel/GameView split is correct and should stay.** **MobileControls vs HUD desktop-actions are not duplicate work** — they intentionally render mutually exclusive (pointer: coarse), which is clearer than one component branching internally.

Total proposed savings: ~70 LOC, mostly cosmetic. None of the changes alter game behavior.

---

## Proposals

### 1. Drop `key` re-export alias from level-parser.js

**File:** `src/lib/core/level-parser.js:18, 89`
**Risk:** low
**LOC saved:** 1

Inside the file, `key(x, y)` is fine. The export aliases it as `cellKey` solely for board-model.js. Just export `key` (or rename internal use to `cellKey` and drop the alias).

Before:
```js
const key = (x, y) => `${x},${y}`;
// ...
export { key as cellKey };
```
After:
```js
export const cellKey = (x, y) => `${x},${y}`;
```
Then internal calls become `cellKey(x, y)`. Eliminates the `as` indirection — one mental hop fewer when grepping.

---

### 2. Inline `parseGrid`/`extractEntities`/`floodFillFloors` or keep — borderline

**File:** `src/lib/core/level-parser.js:20-87`
**Risk:** low
**LOC saved:** ~6 (mostly function boundaries / docstrings)

The three helpers are each used exactly once by `parseLevel`. Inlining flattens the call graph but the named steps document phases ("parse → extract → flood-fill") and make `parseLevel` a 3-line orchestrator. **Recommendation: keep as-is.** The split aids reading the algorithm sequentially. Only worth flattening if the file grows further.

**Decision:** No change. (Listed for completeness; was a candidate that fails the "must reduce cognitive load" criterion.)

---

### 3. Remove redundant `boxes.length === 0` guard in `isSolved`

**File:** `src/lib/core/board-model.js:69`
**Risk:** low
**LOC saved:** 1

`Array.prototype.every` on an empty array returns `true`, so the guard exists to prevent insta-win on a malformed level with zero boxes. But:
- `parseLevel` already guarantees the level shape; a no-box level is pathological and not in the Microban set.
- GameView's `buildLevel` throws if `!lv.player` but does not validate boxes — adding a similar guard there would be more honest than masking it inside `isSolved`.

Before:
```js
isSolved() {
    if (this.boxes.length === 0) return false;
    return this.boxes.every(b => this.isTarget(b.x, b.y));
}
```
After:
```js
isSolved() {
    return this.boxes.length > 0 && this.boxes.every(b => this.isTarget(b.x, b.y));
}
```
Same logic, one line. (Or drop the guard entirely if zero-box levels are deemed impossible.)

---

### 4. `LevelSelectView.completedCount` is `$state` but never reassigned

**File:** `src/views/LevelSelectView.svelte:18`
**Risk:** low
**LOC saved:** 0 (correctness/clarity)

```js
let completedCount = $state(progressStore.getCompletedCount());
```
Declared `$state` but only read once on mount and never updated. Just use a `const`:
```js
const completedCount = progressStore.getCompletedCount();
```
**Note:** Mirrors `MenuView.svelte:13` which already does this correctly. Picking the right form here also avoids the wrong impression that the count auto-refreshes when returning from a completed level. (If a refresh is desired, that's a separate fix — not this audit's call.)

---

### 5. Promote DonateModal `open` toggle into the modal itself

**File:** `src/views/DonateModal.svelte`, `src/views/MenuView.svelte`, `src/views/GameView.svelte`
**Risk:** low
**LOC saved:** ~6 (3 lines per consumer × 2 consumers, minus modal additions)

Both consumers replicate:
```js
let donateOpen = $state(false);
// ...
onclick={() => (donateOpen = true)}
// ...
<DonateModal open={donateOpen} onClose={() => (donateOpen = false)} />
```
Could expose an imperative `openDonate()` from a tiny `donate-modal-store.js` or use a slot/trigger pattern. **However**, this adds an abstraction layer that's only used twice — borderline YAGNI. **Recommendation:** keep as-is unless a third caller appears. (Listed for visibility.)

---

### 6. Hard-coded margin constants in `computeTileSize`

**File:** `src/views/GameView.svelte:40-50`
**Risk:** low
**LOC saved:** 0 (clarity)

```js
const margin = isCoarse ? 260 : 140; // header + hud (+ mobile controls) + padding
const maxByWidth = Math.floor((window.innerWidth - 80) / level.width);
const maxByHeight = Math.floor((window.innerHeight - margin - 100) / level.height);
```
The literals (`80`, `100`, `140`, `260`) duplicate measurements that also live in the CSS (`max-height: calc(100vh - 140px)` at line 235, `260px` at line 243). When CSS changes, JS silently goes out of sync.

Two options:
- **a)** Extract `const MARGINS = { width: 80, heightDesktop: 240, heightMobile: 360 }` at top of file with a comment, and reuse the same numbers in the CSS via inline style. Adds ~3 LOC, removes duplication.
- **b)** Just add a comment cross-referencing the CSS rule. Zero LOC change, lower risk.

**Recommendation:** option (b) — just a `// keep in sync with .board-wrap max-height below` comment. The literal split is fine.

---

### 7. Wall-cell neighbor scan: precompute floor membership once per render

**File:** `src/views/Board.svelte:40-50`
**Risk:** low
**LOC saved:** 0 (perf, not LOC)

```js
const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]];
for (const k of walls) {
    const { x, y } = keyToXY(k);
    if (DIRS.some(([dx, dy]) => floors.has(`${x + dx},${y + dy}`))) { ... }
}
```
`floors.has(...)` is already O(1). The string concat `\`${x+dx},${y+dy}\`` per check is fine. Move `DIRS` outside `$derived.by` to module scope so it's not re-allocated each render:

```js
const NEIGHBOR_OFFSETS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]];
```
at top-level. Trivial micro-perf — but more importantly, signals intent: this is a constant. **Recommendation: yes.**

---

### 8. `keyToXY` could be inline destructure

**File:** `src/views/Board.svelte:18-21`
**Risk:** low
**LOC saved:** 3

Used 3 times, each as a one-liner. The helper has a name worth keeping for readability — **recommend keeping**. But: if you don't already, you could store the parsed `{x, y}` directly in the data structure rather than `Set<string>`. That's a bigger refactor for level-parser.js — not worth it. **No change.**

---

### 9. `MobileControls` and HUD desktop-actions: keep separate

**File:** `src/views/GameView.svelte` (HUD) + `src/views/MobileControls.svelte`
**Risk:** N/A
**LOC saved:** 0

The audit prompt specifically asked. They are NOT duplicate work:
- HUD `.desktop-actions` is hidden via `@media (pointer: coarse) { display: none }` (line 242).
- `MobileControls` is hidden via the inverse (line 26-28).
- They render different visual targets (top-row text buttons vs bottom-corner D-pad + action stack).
- Trying to unify them would require runtime branching on pointer type, and would couple two distinct interaction paradigms.

**Recommendation: keep as-is.** Each is single-purpose and small.

---

### 10. `BoardModel` vs `GameView` split: keep

**File:** `src/lib/core/board-model.js` + `src/views/GameView.svelte`
**Risk:** N/A
**LOC saved:** 0

The audit prompt specifically asked. Split is correct:
- `BoardModel` is framework-agnostic, no Svelte imports — game logic only.
- `GameView` adapts mutable model into reactive `$state` snapshots, owns input/HUD/win-overlay.

Folding BoardModel into GameView would couple game rules to Svelte and prevent unit-testing the model in isolation. The dual `model` (mutable ref) + `player`/`boxes` (`$state`) pattern in GameView is unusual but clearly commented (lines 32-34). **Recommendation: keep.**

---

### 11. `progressStore` reads localStorage on every method call

**File:** `src/lib/core/progress-store.js`
**Risk:** med
**LOC saved:** 0 (perf)

`isCompleted`, `getBestMoves`, `getCompletedCount` each call `readRaw()` which JSON.parses the entire blob. In `LevelSelectView.visibleLevels` derived block (lines 23-29), this happens 20× (10 reads × 2 fields × per page-change). For 155 levels that's microseconds — but the redundancy is real.

**Option:** in-memory cache initialized lazily on first read, invalidated on `recordCompletion`/`reset`. Adds ~10 LOC.

**Recommendation: don't bother (YAGNI).** Levels are tiny, page-changes are rare, and a cache adds complexity. Listed only for visibility.

---

### 12. Common CSS for overlay/dialog (DRY)

**File:** `src/views/GameView.svelte:251-272`, `src/views/DonateModal.svelte:40-65`
**Risk:** low
**LOC saved:** ~12

Both files repeat the overlay/dialog pattern verbatim:
```css
.overlay {
    position: fixed; inset: 0;
    background: rgba(12, 16, 24, 0.72);
    display: flex; align-items: center; justify-content: center;
    animation: fade-in 180ms ease;
}
.dialog {
    background: var(--panel);
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    /* ... */
}
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```
Move into `src/app.css` as `.overlay`/`.dialog` global classes (only `z-index` differs: 100 vs 200, set inline or via modifier). Save the duplicated `@keyframes fade-in`.

**Recommendation:** yes, low risk, real DRY win. ~12 LOC saved across two files.

---

### 13. Tap-suppression CSS triplet repeated 3× (DRY)

**File:** `src/app.css:50-59`, `src/views/AppButton.svelte:43-46`, `src/views/MobileControls.svelte:69-72, 83-86`, `src/views/Board.svelte:103-104`
**Risk:** low
**LOC saved:** ~6

The trio:
```css
touch-action: manipulation;
user-select: none;
-webkit-user-select: none;
-webkit-tap-highlight-color: transparent;
```
appears in 4 places. Body already has `user-select: none` globally — so each per-element block is partly redundant.

**Option:** add a global utility in `app.css`:
```css
.tap-clean,
button.tap-clean {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
```
And apply via class. Or: move `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` onto the global `button` selector in `app.css` since every button in the app wants them.

**Recommendation:** add to global `button { ... }` in `app.css`. Removes the per-component duplication.

Before (`app.css`):
```css
button {
    font-family: inherit;
}
```
After:
```css
button {
    font-family: inherit;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
```
Then strip those two lines from AppButton, MobileControls (×2), Board removes nothing (it's on `.board` not button).

---

### 14. `package.json` description still says Phaser

**File:** `package.json:3`
**Risk:** low
**LOC saved:** 0

```json
"description": "A simple Sokoban game built with Phaser 3 and Vite",
```
The codebase is Svelte 5 + Vite, no Phaser. Update to:
```json
"description": "Sokoban puzzles (Microban set) built with Svelte 5 and Vite",
```

---

### 15. `vite/config.codeserver.mjs` defensive `Number(env.CODESERVER_PORT || 8080)`

**File:** `vite/config.codeserver.mjs:7`
**Risk:** low
**LOC saved:** 0 (clarity)

```js
const port = Number(env.CODESERVER_PORT || 8080);
```
Fine as-is. Throws on `CODESERVER_HOST` missing but silently defaults port. Consistent with `dev.mjs` which also uses `8080`. Could extract a shared `DEFAULT_DEV_PORT = 8080` constant — but the literal appears in only 2 files and is self-documenting. **No change.**

---

### 16. `progress-store.getCompletedCount` doesn't filter by `=== true`

**File:** `src/lib/core/progress-store.js:45-47`
**Risk:** low
**LOC saved:** 0 (correctness)

```js
getCompletedCount() {
    return Object.keys(readRaw().completed).length;
}
```
Counts any key in `completed`, regardless of value. Today only `true` is written, so it works. If `recordCompletion` ever conditionally clears a level (it doesn't), `false` keys would still count. Defensive nit:
```js
return Object.values(readRaw().completed).filter(Boolean).length;
```
**Recommendation:** skip (YAGNI). Current code is correct given current writers.

---

## Other observations (no change recommended)

- **`haptics.js` (12 LOC)** — perfect minimal wrapper, do not touch.
- **`AppButton.svelte`** — well-scoped, 3 variants × 3 sizes is just right. No prop is unused.
- **`App.svelte` view router** — string-state with three branches is simpler than a router lib here. Correct.
- **`#each ... (key)` with `cell.x + ',' + cell.y`** in Board.svelte — string concat in key is fine; using `\`${x},${y}\`` would be one byte shorter but no clearer.
- **No dead imports found.** All `import` statements are used.
- **No unused props found** across components.
- **No unreachable branches found.**

---

## Aggregated proposal table

| # | File | Risk | LOC | Recommend? |
|---|------|------|-----|------------|
| 1 | level-parser.js | low | 1 | yes |
| 3 | board-model.js | low | 1 | yes (small) |
| 4 | LevelSelectView.svelte | low | 0 | yes |
| 7 | Board.svelte | low | 0 | yes (clarity) |
| 12 | GameView/DonateModal CSS | low | ~12 | **yes (best win)** |
| 13 | global button CSS | low | ~6 | yes |
| 14 | package.json description | low | 0 | yes |
| 2,5,6,8,9,10,11,15,16 | various | — | — | **no** (YAGNI / no benefit) |

**Total realistic savings:** ~20 LOC + reduced CSS duplication. Most files already meet the "every line earns its keep" bar.

---

## Unresolved questions

1. **Stale `completedCount` in LevelSelectView** — Should the count refresh when the user returns from a freshly completed level? Currently it doesn't (it's read once on mount, even though it's `$state`). If yes, that's a real bug — but fixing it is feature work, not simplification, so I left it out of the proposals. Confirm desired behavior.
2. **Are zero-box levels possible in user-supplied data?** Affects whether proposal #3's guard removal is safe long-term. Today's Microban set has none.
3. **Is the `GameView.computeTileSize` margin-literal duplication worth fixing?** Proposal #6 leans "no, just comment", but if you plan to tune mobile layout further, extracting constants helps.

---

**Status:** DONE
