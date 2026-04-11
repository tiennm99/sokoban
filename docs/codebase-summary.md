# Codebase Summary

## Layout
```
src/
├── main.js                         # Entry: boots Phaser on #game-container
└── game/
    ├── main.js                     # Phaser Game config + scene registration
    ├── data/
    │   └── microban-levels.js      # 100 XSB level strings
    ├── core/
    │   ├── level-parser.js         # XSB text → {walls, targets, boxes, player, floors}
    │   ├── board-model.js          # Pure game state + move/undo/win logic
    │   ├── progress-store.js       # localStorage persistence (completed + best moves)
    │   └── theme.js                # Nord color palette, fonts, tile-size helper
    ├── ui/
    │   ├── button-factory.js       # Reusable rounded button with hover/press
    │   └── board-renderer.js       # Draws the board + animates moves
    └── scenes/
        ├── menu-scene.js           # Title, play, progress counter, keybinds
        ├── level-scene.js          # Paginated 5×4 level grid (5 pages × 20)
        └── game-scene.js           # Gameplay: input, HUD, win overlay

public/
├── style.css                       # Page background + container shadow
├── favicon.png
└── assets/                         # bg.png, logo.png (reserved for future use)
```

## Data flow
1. `main.js` creates the Phaser Game with Menu / Level / Game scenes.
2. `level-scene` writes `registry.currentLevel` on click, starts `GameScene`.
3. `game-scene` reads the level index, calls `parseLevel()` on the XSB string, builds a `BoardModel`, hands it to `BoardRenderer`.
4. Input → `BoardModel.tryMove()` → `BoardRenderer.animateMove()` → win check → `progressStore.recordCompletion()`.

## Key design choices
- **XSB at runtime**: levels are stored as the standard Sokoban text format; the parser flood-fills interior floor tiles so the renderer only paints inside the puzzle shape.
- **Pure `BoardModel`**: move/undo/win logic has zero Phaser dependencies — trivial to unit-test later.
- **No Arcade physics**: the original version wired colliders but moved sprites by tween; the physics system did nothing. Removed.
- **One button factory**: every scene goes through `createButton()` so hover/press feels identical everywhere.

## File size budget
Every file under 200 LOC per development rules. Data file (`microban-levels.js`) exceeds that because it's pure data, not logic.
