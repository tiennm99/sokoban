---
agent: code-reviewer
date: 2026-04-27
slug: whole-project-review
plan: 260427-1151-mobile-comfort
---

# Sokoban — Whole-Project Adversarial Review

Full-tree review (Svelte 5 + Vite, GH Pages, PWA). Mobile-comfort items already covered in `code-reviewer-260427-2023-mobile-comfort-review.md` are skipped here.

## Scope
- 1395 LOC across `src/` (excl. microban-levels.js)
- Configs: `vite/*.mjs`, `package.json`, `index.html`
- Plans: `plans/260411-2027-*`, `plans/260412-0002-*`, `plans/260427-1151-*`

## Overall Assessment
Code is small, clean, and idiomatic for Svelte 5 runes. KISS/DRY mostly respected. Real issues center on **global keyboard listener collisions** and a few small parser/storage robustness gaps. Nothing blocks shipping. Most findings are hygiene + a11y.

---

## Critical

### C1. Escape on win+donate triggers BOTH modal close AND navigate-to-levels
**Files:** `src/views/DonateModal.svelte:10-12, 22`, `src/views/GameView.svelte:99-100, 140`

Both components register independent `<svelte:window onkeydown>` listeners. When `won === true` and the user opens "BUY ME A COFFEE", the win-overlay modal sits on top, but **GameView's listener is still active**. Pressing Escape:
1. DonateModal `onKey` → `onClose()` → modal closes.
2. GameView `onKey` matches Escape → `onLevels()` → navigates away.

Net effect: user is yanked to the level-select screen even though they only wanted to dismiss the donate modal. Reproduces also from MenuView donate (pressing Escape triggers nothing else — no bug there) and from any future modal stacked over GameView.

Same hazard exists for `R` (restart) and `U`/`Z` (undo) keys — those bypass even the donate modal because DonateModal only handles Escape. So keyboard users can accidentally restart the level while reading the QR.

**Fixes (pick one):**
- Add an `inert` flag prop / module-level "modal open" guard that GameView's `onKey` checks.
- Track a tiny global `modalsOpen` count in a store; GameView's `onKey` early-returns when > 0.
- Or, in DonateModal `onKey`, also intercept R/U/Z/Arrows when open and call `e.stopPropagation()` — but `<svelte:window>` listeners are siblings, stopPropagation between them does NOT prevent the other from firing. So this approach won't work; needs a shared flag.

Smallest fix: a module-scoped `let isModalOpen = $state(false)` in a shared store, GameView's `onKey` returns early if true.

---

### C2. Win-overlay dialog has no focus management or focus trap
**File:** `src/views/GameView.svelte:182-198`

When win overlay opens, focus stays wherever it was (probably body on touch). On desktop:
- Tab order continues through HUD, Board (no focusables), and finally reaches the overlay buttons.
- An external keyboard user has no idea where they are.
- Screen readers don't announce a dialog because the overlay isn't `role="dialog"` and lacks `aria-modal`.

The `<div class="overlay">` is presentational; the inner `.dialog` has no role. Add:
- `role="dialog" aria-modal="true" aria-labelledby="winTitle"` on the dialog.
- Auto-focus the primary action (`NEXT LEVEL` if `hasNext`, else `LEVELS`).
- Wrap focus inside the dialog (or accept escape risk and at least set initial focus).

(The earlier mobile-comfort review noted the auto-focus part as Low priority #20; flagging higher here because there's also no role/aria.)

---

### C3. DonateModal lacks focus management — same a11y gap
**File:** `src/views/DonateModal.svelte:24-37`

`role="dialog" aria-modal="true"` is set ✓. But:
- `tabindex="-1"` on dialog without programmatic `.focus()` on open → keyboard users start tabbing from body, hit nothing useful.
- No focus trap: Tab leaves the modal back to the underlying view's buttons.
- No restoration of focus to the trigger button on close.

Use a `$effect` to focus the dialog (or its CLOSE button) on `open` becoming true; cache the prior `document.activeElement` and restore on close.

---

## High

### H1. `progressStore` does N+1 localStorage reads on level-select page render
**File:** `src/views/LevelSelectView.svelte:20-32` + `src/lib/core/progress-store.js:9-24`

Each `progressStore.isCompleted(i)` and `getBestMoves(i)` call does a fresh `localStorage.getItem` + `JSON.parse`. For PER_PAGE=20 that's 40 parses per page change. Each `readRaw()` rebuilds the same object. Trivial CPU hit on desktop, real jank on cold-start low-end Android with the new SW also booting.

**Fix:** add `progressStore.snapshot()` returning the full record object once; map over it in `visibleLevels`. Keeps API stable, eliminates the 39 redundant parses.

### H2. `progressStore` has no schema-version handling for future bumps
**File:** `src/lib/core/progress-store.js:7`

Key is hard-coded `sokoban-progress-v1`. If you ever change the shape (e.g. add `time` per level), you must either:
- Bump to `-v2` (orphans v1 data — users lose progress silently).
- Migrate v1 → v2 inline.

Neither path exists today. Fine for the current design, but add a `_v: 1` field inside the JSON and a `migrate(data)` step in `readRaw` so the next bump is painless. Document this in code-standards.md.

Also: `readRaw` accepts ANY shape from JSON.parse — if a hostile extension or another tab corrupts the value with `{completed: "totally"}`, `data.completed[levelIndex]` becomes `"o"` (truthy), `getCompletedCount` returns `Object.keys("totally").length === 7`. Add a shape check: if `completed` isn't an object, fall back to default. Same for `bestMoves`.

### H3. `level-parser.js` silently merges malformed levels
**File:** `src/lib/core/level-parser.js:20-23`

`parseGrid` filters out blank lines and `;` comments, so a future maintainer who adds a level with a blank middle row, or two levels accidentally pasted into one backtick string with a blank separator, will get them merged with no warning. Multiple `@` characters likewise overwrite each other silently (last wins).

Defensive validations (cheap, ~8 lines):
- After `extractEntities`, `console.warn` if multiple `@` are found.
- `console.warn` if `boxes.length !== targets.size`.
- `console.warn` if `floors.size === width * height` (suggests an unsealed level — flood-fill escaped).
- Throw if `player == null` (already handled in GameView; move to parser to fail loudly at module-load if levels ever ship broken).

Microban data is solid today; this is forward-defense for forks / additions.

### H4. PWA-only-in-prod is undocumented, easy to break
**Files:** `vite/config.{dev,codeserver,prod}.mjs`

`VitePWA` only registered in `config.prod.mjs`. **This is the right choice** (avoids stale SW during dev/HMR), but there's no comment in any of the three configs explaining the asymmetry. Next maintainer "harmonising" the configs will accidentally enable SW in dev and create caching nightmares.

**Fix:** one-line header comment in each of the three configs:
- `config.dev.mjs`: `// SW intentionally NOT registered — see config.prod.mjs`
- `config.codeserver.mjs`: same
- `config.prod.mjs`: `// SW only in prod; auto-injected via vite-plugin-pwa default registerType`

---

## Medium

### M1. GameView.svelte is 295 LOC — exceeds documented 200-LOC limit
**File:** `src/views/GameView.svelte`, ref: `docs/code-standards.md:15-17`

CSS bulk is ~90 lines so the JS+template is ~205. Borderline. Consider extracting:
- `WinOverlay.svelte` — the `{#if won}` block (and own role/aria, fixes C2 cleanly).
- A `hooks/useTileSize.js` or just inline `computeTileSize` plus a small `useResizeEffect` helper.

Not blocking; flagging because the standard is project-internal and reviewer-cited.

### M2. Stale plan files marked "In Progress"
**Files:**
- `plans/260411-2027-sokoban-overhaul/plan.md:4` — Status: In Progress (work shipped in commit `1d2fff6`, then expanded in `2ee7ac8` + `8a3d4b4`).
- `plans/260412-0002-svelte-migration/plan.md:4` — Status: In progress (Svelte rewrite shipped in `8a3d4b4`).

Both should be flipped to `Status: Complete` (or moved to a `plans/archive/` dir) so the planner agent's "active plans" listing is accurate. Pure housekeeping.

### M3. iOS `100vh` issue in `.board-wrap` height calc
**File:** `src/views/GameView.svelte:235, 243`

`max-height: calc(100vh - 140px)` (and -260px on coarse) uses `100vh`, which on iOS Safari does NOT shrink when the URL bar is visible. On phones, the bottom of the board can slide UNDER the bar. Modern fix: `100dvh` (supported iOS 15.4+, Chrome 108+, FF 101+ — same target audience as the PWA).

### M4. `MenuView.svelte` reads `getCompletedCount()` once at component init
**File:** `src/views/MenuView.svelte:13`

`const completed = ...` not `$state(...)`. Currently fine because `App.svelte`'s `{#if view ===}` remounts MenuView when navigating back. But the moment someone refactors App to keep MenuView mounted (e.g. for a transition animation), the counter goes stale.

Same caveat in `LevelSelectView.svelte:18` — `let completedCount = $state(...)` but never updated. Add a comment, or read it inside `$derived.by` with a dummy reactive trigger when needed.

### M5. `boxAt` is O(n) called twice per move
**File:** `src/lib/core/board-model.js:21-23, 39-43`

For Microban max ~50 boxes this is negligible. But `tryMove` calls `boxAt(nx, ny)` then `boxAt(bx, by)` — that's 2n comparisons. Trivial today; if levels ever go bigger, consider a `Map<cellKey, boxIndex>` rebuilt on each move. YAGNI for now — flagging only.

### M6. `level-parser.js` flood-fill uses a stack of objects (allocs)
**File:** `src/lib/core/level-parser.js:64-79`

`stack.push({ x, y })` allocates on every neighbor visit — for the giant 50×50 finale level that's ~thousands of allocs per parse. Parse runs once per level load (rare). Acceptable. Could pack as `x * width + y` integers, but YAGNI.

---

## Low

### L1. `Object.keys(readRaw().completed).length` counts even falsy values
**File:** `src/lib/core/progress-store.js:46`

If anything ever writes `data.completed[i] = false` (no current code path, but defensive), the count would be wrong. Cheap fix: `Object.values(readRaw().completed).filter(Boolean).length`.

### L2. `MICROBAN_LEVELS[levelIndex]` not bounds-checked
**File:** `src/views/GameView.svelte:21`

If `levelIndex` > 154, `MICROBAN_LEVELS[levelIndex]` is `undefined`, parseLevel splits `undefined`, throws TypeError, caught by try/catch, error displayed. Fine, but UX is a generic "Failed to load level X" — could be a clearer "Level X does not exist". `App.svelte`'s `playLevel(levelIndex + 1)` on the win screen could also bump past the end (`hasNext` guards UI but not API). Belt-and-braces.

### L3. `won` flag is never reset when GameView remounts on level change — but that's by design
**File:** `src/App.svelte:24` (`{#key levelIndex}`) + `src/views/GameView.svelte:60`

The keyed remount makes `won = $state(false)` re-init. Confirmed correct. Just noting that this depends on the `{#key}` — if removed, `won` would persist across levels. Comment in `App.svelte:24` explaining the keying intent already exists ✓.

### L4. README claims "syncs across all devices you use" for localStorage
**File:** `README.md:14`

Misleading — localStorage is per-browser-per-device. Should read "Progress saved locally" or "saved in your browser". Minor honesty fix.

### L5. `index.html` title is "Sokoban — 155 Puzzles" — magic number
**File:** `index.html:9`

If level count ever changes, this drifts. Not worth scripting; just flag.

### L6. `apple-touch-icon` referenced in `index.html` with relative path
**File:** `index.html:6`

`href="./apple-touch-icon.png"` works because `base: '/sokoban/'` is set in prod and the file is in `public/`. On dev (`base: './'`) and codeserver (`base: '/absproxy/...'`), the resolved path differs but the icon is still in `public/` so it works. Just noting the coupling.

### L7. `package.json` description still says "Phaser 3"
**File:** `package.json:3`

`"description": "A simple Sokoban game built with Phaser 3 and Vite"` — outdated since the Svelte rewrite (`8a3d4b4`). Flip to "Svelte 5 + Vite". 1-second fix.

### L8. CSS `.error` class in GameView has no test path
Flagged as "manual smoke test only" in `docs/code-standards.md:38` — acceptable, no action.

### L9. `app.css` `body { user-select: none }` blocks copy of "Best: N" stat
**File:** `src/app.css:55-58`

Aggressive but intentional for game feel. Some users may want to copy their best score for sharing. Cosmetic only.

---

## Edge Cases Found by Scout

- **DonateModal `onClose` undefined?** `let { open = false, onClose } = $props();` — if a parent forgets to pass `onClose`, calling it throws `TypeError: onClose is not a function`. Both call sites (MenuView, GameView) pass it. Add a default `onClose = () => {}` for safety.
- **`computeTileSize` returns 48 when level is null** but `tileSize = $state(computeTileSize())` runs before parseError is set. The Board then never renders (`parseError` branch returns early). No issue.
- **`tryMove` won-gate vs. async**: `won` is a `$state` — synchronously updated in `syncFromModel`. Subsequent `tryMove` calls in the same JS task see the updated value. No race.
- **`#key levelIndex` remount discards the resize listener** — Svelte tears down `<svelte:window>` correctly. ✓
- **Level data: 155 backtick strings, all non-empty, no embedded `;` comments, no exotic chars** — verified via grep count. ✓
- **`floors.has` lookup for wallCells** uses on-the-fly template literal `\`${x + dx},${y + dy}\`` — correct, matches `cellKey` format. ✓
- **`pulse(60)` after `pulse(10)` in same tick** — `navigator.vibrate(60)` overrides the prior. Already noted in prior review #14. No new finding.
- **`progressStore.recordCompletion` ignores quota errors silently** — losing a high-score record on quota-full is acceptable for a tiny progress blob (~1 KB max).

---

## Positive Observations

- `core/` is genuinely framework-free, untouched by the Svelte rewrite. Architecture goal honored.
- `progress-store.js` `try/catch` around localStorage is correct (private mode / disabled storage).
- `BoardModel.tryMove` returns booleans cleanly, history records exactly what's needed for undo. Tight design.
- `Board.svelte` is purely presentational; the `wallCells` optimization (only render walls that touch a floor) is the right call for the "lots of border `#`" XSB format.
- `App.svelte` `{#key levelIndex}` is the cleanest possible "reset on level change" pattern.
- `haptics.js` defensive coding (`typeof navigator`, try/catch around vibrate) is exactly right for the mixed-environment target.
- `AppButton.svelte` wraps native `<button>` — keyboard activation, focus, type=button all native. No reinvention.
- `parseGrid` filtering of `;` comments and blank lines is XSB-compliant.
- Config split (`dev`/`codeserver`/`prod`) is well-scoped and `loadEnv` is used correctly in codeserver.

---

## Recommended Actions (priority order)

1. **Fix C1 (Escape modal collision)** — module-scoped `modalsOpen` flag, GameView `onKey` early-return when set. ~10 lines.
2. **Fix C2 + C3 (focus management)** — auto-focus + focus trap on win dialog and DonateModal. ~30 lines total. Big a11y win.
3. **Fix H1 (N+1 localStorage reads)** — add `progressStore.snapshot()`. ~5 lines.
4. **Fix H4 (document PWA-only-in-prod)** — three one-line comments.
5. **M2 (stale plans)** — flip Status: In Progress → Complete in two plan.md files.
6. **L7 (package.json description)** — drop Phaser reference.
7. **M3 (100dvh)** — replace 100vh in `.board-wrap` calc.
8. **H2/H3 (defensive parser + storage)** — only if a fork-friendly stance is wanted; YAGNI for solo project.

---

## Metrics

- LOC reviewed: 1395 (excl. levels data)
- Files: 14 source + 3 vite configs + 1 index.html + 1 README + 2 plan.md
- Critical: 3 | High: 4 | Medium: 6 | Low: 9
- Type coverage: N/A (vanilla JS, project uses runes-only)
- Tests: none (per code-standards.md `Testing strategy`)

---

## Unresolved Questions

1. **C1 fix approach:** is a global `modalsOpen` store acceptable, or is a per-key disable preferred? The simplest is the global flag.
2. **H4 scope/start_url:** mobile-comfort review's #8 already raised the absolute-path concern. Decision needed: keep `/sokoban/` (current) or switch to `./`? Behavior on PWA install differs.
3. **H2 schema bump:** any near-term plan to add per-level data (time, optimal-pushes, etc.) that would force a v2 migration?

**Status:** DONE_WITH_CONCERNS
**Summary:** Code is small and clean. One real keyboard-routing bug (C1: Escape both closes modal AND navigates), two a11y gaps (C2/C3: no focus management on either dialog), and a 40× redundant localStorage read on the level-select page. Everything else is hygiene or forward-defense.
**Concerns:** C1 is a user-visible regression for keyboard users on the win-screen donate modal; recommend fixing before next release.
