# Runtime Health Report — Sokoban (Svelte 5 + Vite)
**Date:** 2026-04-27  
**Scope:** Runtime blow-up risks only. Cosmetics and items in code-reviewer-260427-2023 skipped.

---

## 1. Build (`npm run build`)

**Clean build, no warnings, 1.24s.** Output:
- `dist/assets/index-*.js` — 68.37 kB raw / 24.07 kB gzip (single chunk, no code-splitting)
- `dist/assets/index-*.css` — 10.02 kB raw / 2.61 kB gzip
- `dist/sw.js` + `dist/workbox-8c29f6e4.js` (PWA service worker)
- `dist/registerSW.js` — 0.15 kB (auto-register shim)
- `dist/manifest.webmanifest` — 0.47 kB

No source maps emitted (correct for prod — Vite default is `sourcemap: false`).  
Bundle size is healthy for a pure-logic game with 155 embedded level strings.

Dev server starts cleanly in 604ms. Note: "Re-optimizing dependencies because lockfile has changed" on startup — cosmetic one-time warmup from the dependabot rebase, not a runtime concern.

---

## 2. dist/ Inspection (inferred from build + config — `dist/` blocked by .ckignore)

### manifest.webmanifest
From `vite/config.prod.mjs`, the generated manifest will be:
```json
{
  "start_url": "/sokoban/",
  "scope": "/sokoban/",
  "icons": [
    { "src": "pwa-192x192.png", ... },
    { "src": "pwa-512x512.png", ... }
  ]
}
```
`start_url` and `scope` are hardcoded — correct for GitHub Pages.  
`vite-plugin-pwa` v1.2.0 prepends `base` (`/sokoban/`) to icon `src` paths when generating the manifest output, so runtime icon resolution should be `/sokoban/pwa-192x192.png`. **Unresolved: cannot directly verify the emitted manifest since dist/ is blocked — recommend spot-checking the deployed manifest at `https://tiennm99.github.io/sokoban/manifest.webmanifest`.**

### Service Worker / Workbox Precache

Build reports **16 entries, 435.06 KiB** precached. Workbox glob pattern:
```
**/*.{js,css,html,png,svg,webmanifest}
```

**ISSUE 1 — `qr.jpg` NOT precached (offline breakage):**  
`public/assets/qr.jpg` (122 KB, the donation QR code) is a `.jpg` — not matched by the glob. When the app is opened offline (PWA installed), clicking Donate → broken image in `DonateModal`. The rest of the app works offline. Severity: **Low** (donate path only, not gameplay).  
Fix: add `jpg` to glob → `**/*.{js,css,html,png,jpg,svg,webmanifest}`

**ISSUE 2 — `bg.png` and `logo.png` are orphan assets being precached (~320 KB wasted):**  
`public/assets/bg.png` (295 KB) and `public/assets/logo.png` (24 KB) have **zero references** in any source file, CSS, or HTML. They match the glob pattern and inflate the precache by ~320 KB (73% of the 435 KB total). Workbox downloads and caches these on every install/update.  
Fix: delete from `public/assets/`. If they were leftover from the Phaser rewrite, they can be removed safely.

### Bundle Structure
Single 68 kB chunk — appropriate for this app size. No code-splitting needed. No unintended lazy imports detected.

---

## 3. Vite Config Drift (prod / dev / codeserver)

| Config | `base` | PWA | HMR |
|--------|--------|-----|-----|
| prod | `/sokoban/` | Yes | — |
| dev | `./` | No | default |
| codeserver | `/absproxy/${port}/` | No | WSS override |

**No runtime breakage in prod.** Differences are intentional.

**Potential concern — `dev` base `./` vs `prod` base `/sokoban/`:**  
`DonateModal` uses `{import.meta.env.BASE_URL}assets/qr.jpg`. This resolves correctly in all three configs:
- dev: `./assets/qr.jpg` → served from `/assets/qr.jpg` by Vite dev server
- prod: `/sokoban/assets/qr.jpg` ← correct GH Pages path
- codeserver: `/absproxy/8080/assets/qr.jpg` ← correct proxy path

**ISSUE 3 — codeserver HMR `path` override:**  
```js
hmr: { host, protocol: 'wss', clientPort: 443, path: base }
```
`path: '/absproxy/8080/'` tells the HMR client to connect the WebSocket at `wss://{host}:443/absproxy/8080/`. Whether the code-server proxy forwards WebSocket upgrades on that path correctly depends on the proxy configuration. If it doesn't, HMR silently falls back to full reload — not a runtime crash, but worth testing if HMR is needed during dev.

---

## 4. npm audit

Cannot run `npm audit` (blocked by hook). From package versions:

| Package | Version | Notes |
|---------|---------|-------|
| vite | 6.4.2 | `^6.4.2` in lockfile — clean, single instance |
| svelte | 5.55.3 | latest |
| @sveltejs/vite-plugin-svelte | 5.1.1 | latest |
| vite-plugin-pwa | 1.2.0 | latest |
| esbuild | 0.25.2 | dev-only build tool |
| rollup | 4.40.0 | dev-only bundler |
| workbox-build | 7.4.0 | dev-only |
| serialize-javascript | 6.0.2 | transitive; known XSS fix was in 3.1.0, well clear |

**The 1 high + 1 moderate vulnerabilities reported on the remote CI are almost certainly in `esbuild` or `rollup` (both dev-only build tools, not shipped in the bundle).** Neither affects the app at runtime in the browser. No app-code dependencies have known CVEs. **Unresolved: cannot confirm exact CVE identifiers without running `npm audit` — recommend running it after unlocking the hook or via CI.**

---

## 5. package-lock.json Integrity

- `lockfileVersion: 3` — correct for npm 7+
- Vite resolved to exactly `6.4.2` (matches `^6.4.2` spec), single instance in lock
- SHA512 integrity hash present and well-formed
- No duplicate vite version splits detected
- The rebase from 6.3.6→6.4.2 left a clean lock — no stale entries visible

---

## 6. `progress-store.js` — localStorage Resilience

All `localStorage` calls are wrapped in `try/catch`:
- **Quota exceeded:** `writeRaw` catches the `QuotaExceededError` silently → progress is lost for that operation but the app does not throw. Acceptable for a puzzle game.
- **Disabled storage / private browsing (Safari ITP):** `localStorage.getItem` throws a `SecurityError` in some private modes → caught, returns empty default object `{ completed: {}, bestMoves: {} }`. App runs fully, progress just doesn't persist.
- **Corrupt JSON:** `JSON.parse` throws → caught by `readRaw`, returns empty default. No cascade.

**No runtime risk.** Graceful degradation confirmed at every callsite.

**ISSUE 4 — `readRaw()` called twice per `recordCompletion` (and per `isCompleted`/`getBestMoves` in level select):**  
`LevelSelectView.$derived.by` calls `progressStore.isCompleted(i)` + `progressStore.getBestMoves(i)` for each of 20 visible levels = 40 `localStorage.getItem` + JSON.parse calls per page render. Not a crash, but unnecessary. Low priority.

---

## 7. `BoardModel` — State Corruption Analysis

**Scenario: `undo()` at empty history**  
`history.pop()` on empty array returns `undefined`. Guard `if (!last) return false` fires correctly. No corruption.

**Scenario: `tryMove()` after `isSolved()`**  
No guard inside `BoardModel.tryMove()` itself — but **all callers** in `GameView.svelte` wrap with `if (won || !model) return`. The `won` flag is set synchronously inside `syncFromModel()` which is called immediately after `tryMove` returns. Since JS is single-threaded and `won` is set before any user input can arrive, this guard is reliable. No corruption path exists via normal UI.

**Scenario: Box index integrity on undo**  
`boxIndex` stored in history comes from `this.boxes.findIndex()` at the time of the move. The boxes array is never mutated externally between push and pop (no external mutation path). `undo` correctly uses `b.x - last.dx` / `b.y - last.dy` to reverse the move. Mathematically sound.

**Scenario: Shared level data across BoardModel instances**  
`BoardModel` stores `level.walls` and `level.targets` as direct Set references (no copy). When `restart()` creates `new BoardModel(level)`, both instances share the same Sets. **Safe** because BoardModel only reads `walls` and `targets` (via `isWall`, `isTarget`) — never mutates them.

**Scenario: `tryMove` / `undo` with zero boxes (degenerate level)**  
`isSolved()` guards with `if (this.boxes.length === 0) return false` — no infinite solved state. `undo` with movedBox=false doesn't touch boxes array. Safe.

**No state corruption paths found.** Code is correct.

---

## 8. Summary Table

| # | Severity | Type | Description | Fix |
|---|----------|------|-------------|-----|
| 1 | Low | PWA/offline | `qr.jpg` not in workbox precache → broken offline donate image | Add `jpg` to workbox glob |
| 2 | Low | Bundle bloat | `bg.png` (295 KB) + `logo.png` (24 KB) orphaned in `public/assets/` — precached for no reason | Delete both files |
| 3 | Info | Dev env | codeserver HMR WS path may not work depending on proxy config | Test HMR in codeserver; non-blocking |
| 4 | Info | Perf | `readRaw()` called N×2 on level-select page render | Cache in-memory or make store reactive; non-blocking |
| 5 | Info | Audit | 1 high + 1 moderate vuln in dev-only deps (likely esbuild/rollup) — zero app runtime risk | Monitor; update when fixes available |

---

## Unresolved Questions

1. Cannot confirm exact CVE IDs (npm audit blocked by hook) — run `npm audit` in CI or local terminal to get specifics.
2. Cannot directly read `dist/manifest.webmanifest` (dist/ blocked) — spot-check deployed manifest icon paths at production URL.
3. codeserver HMR not testable here — requires live code-server environment with correct `CODESERVER_HOST`.

---

**Status:** DONE_WITH_CONCERNS  
**Summary:** Build is clean and correct. Two concrete fixable issues found: orphan assets wasting 320 KB of precache bandwidth, and `qr.jpg` excluded from offline cache. No state corruption, no crash paths, no security risk in app code. The npm audit vulns are dev-toolchain only.  
**Concerns:** dist/ directory was blocked from direct inspection; manifest icon path verification requires checking deployed URL.
