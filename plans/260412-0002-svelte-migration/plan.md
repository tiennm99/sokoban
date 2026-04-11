# Svelte Migration

**Date:** 2026-04-12
**Status:** In progress

## Goal
Replace Phaser 3 with Svelte 5 as the rendering/UI layer. Keep framework-agnostic modules untouched. Ship a smaller, more structured, natively-clickable version of the same game.

## Stays
- `core/level-parser.js`, `core/board-model.js`, `core/progress-store.js` → moved to `src/lib/core/`
- `data/microban-levels.js` → moved to `src/lib/data/`
- All 155 levels
- Nord palette (ported to CSS variables)
- Vite as build tool, GitHub Pages deploy

## Goes
- `phaser` dependency, `terser` devDependency, `log.js` analytics ping
- `src/game/` (main, scenes, ui)
- Vite `manualChunks: { phaser }`, `phasermsg` plugin, terser options
- `npm run dev/build` scripts' `node log.js … &` prefix

## Comes in
- `svelte` + `@sveltejs/vite-plugin-svelte` devDependencies
- `src/App.svelte` — view router
- `src/main.js` — mount point
- `src/app.css` — theme + resets
- `src/views/MenuView.svelte`
- `src/views/LevelSelectView.svelte`
- `src/views/GameView.svelte`
- `src/views/Board.svelte`
- `src/views/AppButton.svelte`

## Steps
1. Update `package.json` deps and scripts.
2. `npm install`.
3. Port core/data modules to `src/lib/`.
4. Write Svelte components + entry.
5. Update `vite/config.*.mjs` (svelte plugin; drop Phaser-specific bits).
6. Update `index.html`.
7. Delete old `src/game/`, `log.js`.
8. Verify prod build.
9. Update docs (codebase summary, architecture, changelog, roadmap).
10. Single atomic commit.
