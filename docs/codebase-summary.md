# Codebase Summary

## Layout
```
src/
├── main.js                         # Mounts App.svelte into #app
├── App.svelte                      # Root router: menu / levels / game
├── app.css                         # Nord palette (CSS variables) + resets
├── lib/
│   ├── core/
│   │   ├── level-parser.js         # XSB text → {walls, targets, boxes, player, floors}
│   │   ├── board-model.js          # Pure game state + move/undo/win logic
│   │   ├── progress-store.js       # localStorage persistence (completed + best moves)
│   │   └── haptics.js              # navigator.vibrate wrapper (10ms on box push, 60ms on win)
│   └── data/
│       └── microban-levels.js      # 155 XSB level strings (Microban, D. W. Skinner)
└── views/
    ├── MenuView.svelte             # Title, play, progress, hints
    ├── LevelSelectView.svelte      # Paginated 5×4 grid (20/page × 8 pages)
    ├── GameView.svelte              # Board + HUD + win overlay + input + haptics
    ├── Board.svelte                # Presentational DOM board (div-per-tile, touch-action: none)
    ├── MobileControls.svelte       # On-screen D-pad + action stack (hidden on desktop)
    └── AppButton.svelte             # Shared themed button (wraps native <button>)

public/
├── style.css                       # Legacy file — theme now lives in src/app.css
├── favicon.png
└── assets/                         # qr.jpg (donate VietQR)
```

## Data flow
1. `src/main.js` mounts `App.svelte`.
2. `App.svelte` holds `view` and `levelIndex` state and renders one of three view components.
3. `MenuView` → calls `onPlay()` → App switches to `LevelSelectView`.
4. `LevelSelectView` reads completion + best-move data from `progressStore`, renders a paginated grid, calls `onSelect(i)` on click.
5. `GameView` is keyed on `levelIndex` (`{#key levelIndex}` in App) so every level change remounts it with fresh state.
6. Inside `GameView`: `parseLevel(xsb) → new BoardModel(level)`, keyboard input calls `model.tryMove()` / `model.undo()`, after each mutation `syncFromModel()` reassigns the `$state` snapshots that `Board` reads as props.
7. On win: `progressStore.recordCompletion()` + overlay with NEXT / LEVELS actions.

## Key design choices
- **Framework-agnostic core.** `level-parser.js`, `board-model.js`, `progress-store.js`, `haptics.js`, and `microban-levels.js` contain zero Svelte — they could be lifted into any other stack.
- **BoardModel as a non-reactive ref.** Svelte reactivity is driven by plain `$state` snapshot fields (`player`, `boxes`, `moves`, `won`) that `syncFromModel()` reassigns after every mutation. Cleaner than making the class instance itself reactive.
- **Board is purely presentational.** Takes plain props (`walls`, `targets`, `floors`, `player`, `boxes`, `tileSize`) so Svelte reactivity is predictable. Desktop & mobile share the same component; `touch-action: none` blocks browser gestures on all devices.
- **Mobile controls opt-in.** `MobileControls.svelte` is hidden on desktop via `@media (pointer: coarse)`, so no UA sniffing or JS feature detection — CSS media queries handle the split.
- **Haptics are graceful.** `haptics.js` wraps `navigator.vibrate` with try/catch and no-op fallback. Callers can vibrate without checking support; unsupported devices silently ignore the call.
- **Animations via CSS.** Box and player use `transform: translate()` with `transition: transform 110ms ease`. No JS animation loop.
- **Responsive tile sizing.** `GameView.computeTileSize()` picks a tile size that fits the level inside the viewport, capped at 56 px.
- **Safe-area insets.** Bottom controls use `env(safe-area-inset-*)` for notch/Home-indicator safety on iPhones and Android phones with nav bars.
- **Scoped CSS per component.** Svelte SFCs keep markup, style, and logic co-located and isolate styles to the component that owns them.

## File size
Every `.js` / `.svelte` file is under the 200-LOC budget, except `microban-levels.js` which is pure data (155 XSB strings) and exempt.
