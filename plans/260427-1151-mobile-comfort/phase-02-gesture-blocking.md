# Phase 02 — Browser Gesture & Selection Blocking

**Priority:** High
**Status:** pending
**Effort:** ~S (CSS + meta tweaks)

## Context

- Brainstorm: [../reports/brainstorm-260427-1151-mobile-comfort.md](../reports/brainstorm-260427-1151-mobile-comfort.md)
- Touches: `index.html`, `src/app.css`, `src/views/Board.svelte`

## Overview

Block mobile browser quirks that ruin gameplay: pull-to-refresh, double-tap zoom, long-press text selection, iOS callout menu, overscroll bounce. Game-area only — input fields elsewhere keep native behaviors (n/a here, no inputs in app).

## Requirements

- No pull-to-refresh on iOS Safari / Chrome Android
- No double-tap zoom on board / D-pad / buttons
- No text selection on long-press tile / button
- No iOS callout menu (image save dialog) on long-press
- No overscroll bounce above/below the page

## Architecture

Layered defense:
1. `index.html` viewport meta — disable user pinch zoom
2. `<body>` / app root — `overscroll-behavior: contain`, `user-select: none`
3. `Board.svelte` — `touch-action: none` (board area never scrolls; D-pad handles input)
4. `AppButton.svelte` (already touched in Phase 01) — `touch-action: manipulation`

## Related Code Files

**Modify**
- `index.html` — viewport meta
- `src/app.css` — global selection lock + overscroll
- `src/views/Board.svelte` — `touch-action: none`, `user-select: none`

## Implementation Steps

1. `index.html` viewport meta:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
   ```
   `viewport-fit=cover` is needed by Phase 03 safe-area insets.
2. `src/app.css` global rules:
   ```css
   html, body {
     overscroll-behavior: contain;
     -webkit-tap-highlight-color: transparent;
   }
   body {
     user-select: none;
     -webkit-user-select: none;
     -webkit-touch-callout: none;
   }
   ```
3. `src/views/Board.svelte` — add to `.board` style:
   ```css
   touch-action: none;
   user-select: none;
   ```
4. Quick check: dev server in mobile emulation — try long-press tile, swipe-down at top of page, double-tap empty area

## Todo

- [ ] Update viewport meta in `index.html`
- [ ] Add overscroll/select rules to `src/app.css`
- [ ] Add `touch-action: none` to `.board` in `Board.svelte`
- [ ] Manual: pull-to-refresh, double-tap zoom, long-press selection all blocked

## Success Criteria

- iOS Safari emulation: cannot pull-to-refresh, cannot pinch-zoom, no callout on long-press
- Android Chrome emulation: same
- Desktop unaffected: text in level-complete dialog still selectable? (Acceptable trade-off: consider exempting `.dialog` if needed)

## Risks

| Risk | Mitigation |
|------|------------|
| Accessibility users rely on browser zoom | `maximum-scale=1` blocks it; if user complaint surfaces, revisit (e.g. drop `maximum-scale` and rely only on `touch-action: none` on board) |
| Win dialog text un-selectable | Add `.dialog { user-select: text; }` if user wants to copy moves count |

## Next

- Phase 03: safe-area insets + haptics (depends on `viewport-fit=cover` from this phase)
