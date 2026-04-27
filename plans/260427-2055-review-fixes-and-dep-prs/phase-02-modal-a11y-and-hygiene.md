# Phase 02 — Modal A11y + Simplifier Hygiene Wins

**Priority:** Medium
**Status:** pending
**Effort:** ~M (touches 4-5 files, ~30 LOC saved net)

## Context

- Reviewer C3: DonateModal lacks auto-focus on open and focus-restore on close.
- Simplifier #12: `.overlay`/`.dialog` CSS duplicated between GameView and DonateModal — extract to `app.css`.
- Simplifier #13: `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` repeated; could move to global `button { }` in `app.css`.
- Simplifier #1: `level-parser.js` has `key as cellKey` re-export — only used inside `board-model.js`; alias is purely cosmetic. Drop or pick one name.
- Simplifier #3: `BoardModel.isSolved` has `if (this.boxes.length === 0) return false;` — Microban guarantees ≥1 box, but the guard is also cheap to keep. Inline the early-return into the return expression for one-line clarity.
- Simplifier #4: `LevelSelectView` declared `completedCount` as `$state` but never reassigns it — should be `const`.
- Simplifier #7: `Board.svelte` redeclares `DIRS` array inside `$derived.by` — move to module scope.

## Out of scope

- `LevelSelectView.completedCount` not refreshing on return-from-game — separate bug, not a simplification (would belong in a future bugfix plan).
- DonateModal extraction into a store (only 2 callsites).

## Architecture

```
app.css                  + .overlay / .dialog shared classes
                         + global button { touch-action; -webkit-tap-highlight-color }

GameView.svelte          remove .overlay / .dialog scoped CSS, use shared
DonateModal.svelte       remove .overlay / .dialog scoped CSS, use shared
                         + auto-focus CLOSE on open, restore on close
MobileControls.svelte    remove now-redundant button styles
AppButton.svelte         remove now-redundant touch-action / tap-highlight

level-parser.js          drop `key as cellKey` re-export
board-model.js           import key directly (rename usages)
board-model.js           inline isSolved guard
LevelSelectView.svelte   $state completedCount → const completedCount
Board.svelte             hoist DIRS to module scope
```

## Implementation Steps

### A. Modal a11y — DonateModal focus management

```svelte
<script>
    let { open = false, onClose } = $props();
    let dialogEl = $state();
    let prevFocus = $state(null);

    $effect(() => {
        if (open) {
            prevFocus = document.activeElement;
            // Focus the dialog itself (tabindex=-1) so initial Tab lands on first button.
            queueMicrotask(() => dialogEl?.focus());
        } else if (prevFocus instanceof HTMLElement) {
            prevFocus.focus();
            prevFocus = null;
        }
    });

    function onKey(e) { if (open && e.key === 'Escape') onClose(); }
    function onBackdropClick(e) { if (e.target === e.currentTarget) onClose(); }
</script>
...
<div class="dialog" bind:this={dialogEl} role="dialog" ...>
```

### B. Shared dialog CSS — `app.css`

```css
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(12, 16, 24, 0.72);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: dialog-fade-in 180ms ease;
    padding: 16px;
}

.dialog {
    background: var(--panel);
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
}

@keyframes dialog-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

GameView's `.dialog` and DonateModal's `.dialog` keep their unique padding/gap/max-width as scoped overrides. Only the structural rules move.

### C. Global button base in `app.css`

```css
button {
    font-family: inherit;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}
```

Remove the equivalent rules from `AppButton.svelte` and `MobileControls.svelte` (`.action`, `.arrow`).

### D. Simplifier nits

- `level-parser.js`: change `export { key as cellKey }` to `export { key as cellKey, key }` (or pick one name and delete the alias plus update the one importer).
  - Cleanest: delete the alias, export `cellKey` directly and rename the internal `key` function.
  - Update `board-model.js` import.
- `board-model.js`: `isSolved()` becomes `return this.boxes.length > 0 && this.boxes.every(b => this.isTarget(b.x, b.y));`
- `LevelSelectView.svelte`: `let completedCount = $state(...)` → `const completedCount = ...` (already declared once, never reassigned).
- `Board.svelte`: hoist `const DIRS = [...]` above `<script>` body's `$derived.by` block (or simply outside the destructured arrow).

## Related Code Files

**Modify**
- `src/app.css` — add shared `.overlay/.dialog`, global `button` rules
- `src/views/GameView.svelte` — remove duplicated dialog CSS
- `src/views/DonateModal.svelte` — remove duplicated dialog CSS, add focus mgmt
- `src/views/AppButton.svelte` — drop now-global touch-action/tap-highlight
- `src/views/MobileControls.svelte` — drop now-global touch-action/tap-highlight from `.action`/`.arrow`
- `src/lib/core/level-parser.js` — collapse `key`/`cellKey` to single name
- `src/lib/core/board-model.js` — update import; inline isSolved guard
- `src/views/LevelSelectView.svelte` — `$state` → `const`
- `src/views/Board.svelte` — hoist `DIRS`

## Todo

- [ ] Add shared `.overlay/.dialog` rules + global `button` to `app.css`
- [ ] Remove duplicated CSS from `GameView.svelte` and `DonateModal.svelte`
- [ ] Add `dialogEl` ref + `$effect` for focus mgmt in `DonateModal.svelte`
- [ ] Drop redundant button styles from `AppButton.svelte` and `MobileControls.svelte`
- [ ] Collapse `key`/`cellKey` alias in `level-parser.js` + update import
- [ ] Inline `isSolved` length guard in `board-model.js`
- [ ] Make `completedCount` const in `LevelSelectView.svelte`
- [ ] Hoist `DIRS` in `Board.svelte`
- [ ] Build clean
- [ ] Manual: open menu donate modal → verify focus lands on dialog → Tab cycles → Esc closes → focus returns to DONATE button

## Success Criteria

- Build clean
- DonateModal focus management works on both menu and win-screen entry points
- No visual regressions in dialogs (overlay, padding, fade-in)
- Net LOC reduction ≥ 15 lines
- All keyboard shortcuts still work as before

## Risks

| Risk | Mitigation |
|------|------------|
| Removing scoped CSS misses a unique rule | Diff before/after computed style in DevTools for both dialogs |
| Global `button` rule affects unstyled `<button>` outside AppButton/MobileControls | Codebase audit shows AppButton + MobileControls are the only button consumers; level-select buttons in `LevelSelectView` already pick up `font-family: inherit`. `touch-action: manipulation` is universally safe. |
| Renaming `cellKey` breaks something in `microban-levels.js` | Levels file is data, no imports. Safe. |

## Next

- Phase 03: PWA precache cleanup + residual vuln override
