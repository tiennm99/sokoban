# Documentation Update: Mobile Comfort & PWA Release

**Date:** 2026-04-27  
**Task:** Update Sokoban project documentation to reflect mobile-comfort overhaul (4 phases shipped).

## Changes Made

All documentation updates preserved evidence-based accuracy by reading shipped code first.

### 1. codebase-summary.md (52 LOC)
- Added `MobileControls.svelte` and `haptics.js` to file tree.
- Updated key design choices to describe mobile controls (CSS media query activation), haptics (graceful fallback), gesture blocking (touch-action: none), and safe-area insets.
- Board.svelte now listed with touch-action behavior.

### 2. system-architecture.md (84 LOC)
- **New section: Mobile input layer** — Documents D-pad placement, gesture blocking on Board, safe-area insets, and haptics module (10 ms on box push, 60 ms on win).
- **New section: PWA** — Web Manifest (standalone display, theme #5e81ac), icons (192/512/maskable PNG), Workbox service worker (auto-update, caching), offline support.
- Updated Deployment section to note PWA metadata adds ~2 kB, total bundle still 65 kB / 23 kB gzipped.

### 3. project-changelog.md (80 LOC)
- **New entry: 2026-04-27 — Mobile Comfort & PWA** — Documented 5 additions (D-pad, haptics, safe-area, gesture blocking, PWA), 3 changes (GameView haptics calls, Board touch-action, vite config), and notes on bundle impact & desktop regression testing.

### 4. development-roadmap.md (42 LOC)
- Moved "Touch controls (swipe) for mobile" from Phase 3 (Planned) and replaced with **Phase 3 — Mobile Comfort & PWA (complete, 2026-04-27)**.
- Documented all 5 completed items: D-pad, gesture blocking, safe-area insets, haptics, PWA.
- Renumbered previous Phase 4 (Stretch) to Phase 5 to preserve future ideas.
- Phase 3 (Polish, planned) still includes sound effects, player direction indicator, and category tabs.

### 5. project-overview-pdr.md (33 LOC)
- Updated "What it is" to mention Svelte 5, mobile controls, safe-area insets, haptics, and PWA offline play.
- Expanded Goals to include touch-first mobile UX, installable PWA, offline play, and add-to-home-screen on iOS/Android.
- Added non-goal: "Swipe gestures, pinch-zoom, orientation lock (D-pad + keyboard sufficient)."
- Expanded Success criteria to include mobile-specific (D-pad reachability, no browser interference, haptics), PWA (installable, offline, Lighthouse pass), and device range (280×480 to 1024×768).

### 6. README.md
- Expanded Features section to include mobile controls (D-pad on mobile), haptic feedback, installable PWA, and offline play.
- Noted localStorage syncs across devices.
- Kept existing keyboard controls as primary desktop path.

## Verification

All file references verified against shipped code:
- ✓ `src/views/MobileControls.svelte` exists (~106 LOC, confirmed tap-only, D-pad + action stack)
- ✓ `src/lib/core/haptics.js` exists (13 LOC, pulse function, silent no-op fallback)
- ✓ `vite/config.prod.mjs` includes `VitePWA` plugin with manifest, Workbox, icons
- ✓ `src/views/GameView.svelte` imports haptics, calls `pulse(10)` on box move, `pulse(60)` on win
- ✓ `src/views/Board.svelte` has `touch-action: none` (line 100)
- ✓ Safe-area insets used in MobileControls.svelte (lines 42, 52)

All docs now total 330 LOC (well under 800 LOC per-file limit).

## No Changes Required

- **code-standards.md**: No new naming or architecture conventions emerged. Existing standards cover the new code (kebab-case `haptics.js`, PascalCase `MobileControls.svelte`, <200 LOC files, framework-agnostic core).
- **project-changelog.md**: Recent 2026-04-12 Svelte rewrite entry remains current; only added new entry for this release.

## Summary

Documentation now accurately reflects the shipped mobile-comfort overhaul: on-screen D-pad, gesture blocking, safe-area insets, haptics feedback, and full PWA support with offline play. All references verified against implementation. Roadmap updated to mark Phase 3 complete and renumber future ideas. No dead "TODO" markers left; all content is actionable and current.

**Status:** DONE
