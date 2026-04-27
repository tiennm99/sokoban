---
title: Mobile Comfort Overhaul
date: 2026-04-27
status: pending
branch: main
mode: fast
blockedBy: []
blocks: []
---

# Mobile Comfort Overhaul

Make Sokoban comfortable on phones: on-screen D-pad, thumb-zone layout, browser-gesture blocking, safe-areas, haptics, PWA install.

## Goal

Phone (≤480px width): all 155 levels playable one-handed, no browser quirks (pull-to-refresh / double-tap zoom / long-press select), short vibrate on box push & win, installable as standalone app with offline play. Desktop unchanged.

## Phases

| # | File | Title | Status | Independently shippable |
|---|------|-------|--------|-------------------------|
| 01 | [phase-01-mobile-controls.md](phase-01-mobile-controls.md) | Mobile controls + thumb-zone layout | pending | Yes |
| 02 | [phase-02-gesture-blocking.md](phase-02-gesture-blocking.md) | Browser gesture & selection blocking | pending | Yes |
| 03 | [phase-03-safe-areas-haptics.md](phase-03-safe-areas-haptics.md) | Safe-area insets + haptics | pending | Yes |
| 04 | [phase-04-pwa.md](phase-04-pwa.md) | PWA full offline | pending | Yes |

## Key Decisions

- D-pad visible only on `(pointer: coarse)` — no UA sniffing, no JS detection
- Tap-only buttons, no auto-repeat — matches Sokoban's "every move counts" ethos
- D-pad bottom-right, action stack bottom-left (one-thumb friendly)
- BoardModel & game core untouched — UI layer only
- PWA via `vite-plugin-pwa` (workbox, autoUpdate)
- Haptics in standalone module — silent no-op where unsupported

## Reports

- [brainstorm-260427-1151-mobile-comfort.md](../reports/brainstorm-260427-1151-mobile-comfort.md)

## Out of Scope

- Tap-to-walk pathfinding (originally requested, replaced by D-pad)
- Swipe gestures, pinch-zoom, orientation lock
- In-game settings (haptics toggle etc.)

## Success Criteria

- Lighthouse mobile + PWA pass on built bundle
- Manual: phone test on iOS Safari + Android Chrome — D-pad reachable one-handed, no browser interference, install + offline works
- Desktop regression: keyboard input, layout, win flow unchanged
