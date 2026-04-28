---
phase: 01
title: Hide footer on game view + safe-area
status: completed
priority: high
effort: trivial
files: [src/App.svelte]
---

# Phase 01 — Hide footer on game view + safe-area

## Context

Brainstorm decisions D1 + D2. Footer link `https://miti99.com` causes mistouches during gameplay because it sits in the same band as D-pad/action stack.

Footer is `position: fixed; bottom: 6px; pointer-events: none` with the `<a>` having `pointer-events: auto`. Currently rendered globally in `App.svelte` regardless of view.

## Goal

Footer visible only on `view === 'menu'` and `view === 'levels'`. Hidden during `view === 'game'`. Add safe-area inset where shown.

## Implementation

### `src/App.svelte`

1. Wrap `<footer class="site-footer">…</footer>` in a conditional:
   ```svelte
   {#if view !== 'game'}
     <footer class="site-footer">…</footer>
   {/if}
   ```
2. Update `.site-footer` CSS:
   ```css
   bottom: calc(6px + env(safe-area-inset-bottom));
   ```

That's the entire phase.

## Acceptance

- [ ] Footer absent during gameplay (verify in DOM inspector on game view)
- [ ] Footer present on Menu + Level Select
- [ ] On iPhone simulator with home indicator, footer sits above the indicator (does not overlap)
- [ ] Build passes (`npm run build`)
- [ ] No console errors on view transitions

## Risk

Near-zero. Single file, two edits, no logic change.

## Test

Manual:
1. `npm run dev`
2. Resize to 390×844 (iPhone 14)
3. Menu → footer visible at bottom
4. Levels → footer visible at bottom
5. Click level → game starts, footer absent
6. Esc back → footer reappears on level select

## Rollback

`git revert` of phase commit. No data, no migration.
