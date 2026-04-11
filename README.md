# Sokoban

My from-scratch Sokoban game, built with Phaser 3 and Vite. The engine, UI, level parser, and progression system are all my own implementation. The puzzle layouts themselves come from David W. Skinner's freely distributable **Microban** set — I'm not reusing any of his code, only his level designs.

Play: [https://tiennm99.github.io/sokoban/](https://tiennm99.github.io/sokoban/)

## Features
- **100 solvable puzzles** using level layouts from the Microban set (beginner-friendly, concept-focused).
- **Paginated level select** with progress tracking and best-move record per level.
- **Controls**: arrow keys or WASD. `U` / `Z` to undo, `R` to restart, `Esc` for menu.
- **Undo history**, live move counter, animated moves.
- **Progress saved** locally in `localStorage`.
- **Responsive tile sizing** so small and large levels both look right.

## Development

```bash
npm install
npm run dev          # dev server on http://localhost:8080
npm run build        # production build
npm run dev-nolog    # dev without the analytics ping
npm run build-nolog  # build without the analytics ping
```

## Project layout
See [`docs/codebase-summary.md`](docs/codebase-summary.md).

## Documentation
- [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md) — product scope.
- [`docs/system-architecture.md`](docs/system-architecture.md) — how the pieces fit together.
- [`docs/code-standards.md`](docs/code-standards.md) — conventions.
- [`docs/development-roadmap.md`](docs/development-roadmap.md) — past and planned phases.
- [`docs/project-changelog.md`](docs/project-changelog.md) — release notes.

## Credits
- Puzzle layouts: **Microban** level set by David W. Skinner (April 2000). Freely distributable with credit. Original site: http://users.bentonrea.com/~sasquatch/sokoban/
- Game code: tiennm99 (with AI pair-programming from Claude).
- Engine: [Phaser 3](https://phaser.io/).

## License
MIT — see `LICENSE`.
