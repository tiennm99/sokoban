---
title: Mobile Mistouch & Layout Fix
date: 2026-04-28
status: completed
branch: main
mode: fast
blockedBy: []
blocks: []
---

# Mobile Mistouch & Layout Fix

Fix footer mistouch + D-pad/board overlap + Reset destructive tap + D-pad hold-repeat. All 6 decisions locked in brainstorm doc.

## Goal

Mobile gameplay (≤480px) is mistouch-free: cannot tap footer link mid-game, D-pad never overlaps board, Reset requires two taps, holding arrow continuously moves player.

## Reports

- `../reports/ui-ux-260428-0935-mobile-footer-mistouch.md` — UX review (root cause)
- `../reports/brainstorm-260428-1004-mobile-mistouch-and-layout.md` — design + locked decisions

## Phases

| # | File | Title | Status | Independently shippable |
|---|------|-------|--------|-------------------------|
| 01 | [phase-01-footer-hide-on-game.md](phase-01-footer-hide-on-game.md) | Hide footer on game view + safe-area | completed | Yes |
| 02 | [phase-02-layout-refactor.md](phase-02-layout-refactor.md) | In-flow MobileControls (D-pad overlap fix) | completed | Yes |
| 03 | [phase-03-reset-confirm-tap.md](phase-03-reset-confirm-tap.md) | Reset two-tap arming | completed | Yes |
| 04 | [phase-04-dpad-hold-repeat.md](phase-04-dpad-hold-repeat.md) | D-pad press-and-hold repeat | completed | Yes |

## Files affected (all phases combined)

- `src/App.svelte` (phase 01)
- `src/views/GameView.svelte` (phase 02 — layout, possibly phase 03 — Reset state)
- `src/views/MobileControls.svelte` (phases 02, 03, 04)

## Order rationale

01 first — smallest, fixes the reported user complaint immediately, zero risk.
02 second — biggest refactor; do it before adding behavior changes to MobileControls.
03 + 04 stack on top of 02's clean layout.

## Success criteria

Combined acceptance:

- [ ] Cannot tap miti99 link during gameplay
- [ ] Footer respects safe-area on Menu + Level Select
- [ ] D-pad never overlaps board content at 360–430px wide
- [ ] Reset requires two taps within 2s
- [ ] Holding arrow moves player at 130ms/step
- [ ] Build passes, no console errors

## Out of scope

Phase 4 roadmap items (sounds, facing direction, level tabs, unit tests) — separate plan.

## Open questions

(none — locked in brainstorm)
