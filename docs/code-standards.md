# Code Standards

## Language & Toolchain
- ES modules, modern JS (no TypeScript).
- Svelte 5 with runes (`$state`, `$derived`, `$props`).
- Vite as build tool. Dev: `npm run dev`. Prod: `npm run build`.

## Naming
- Plain JS files: **kebab-case** with descriptive names (`board-model.js`, `progress-store.js`).
- Svelte components: **PascalCase.svelte** per ecosystem convention (`MenuView.svelte`, `AppButton.svelte`).
- Classes: PascalCase (`BoardModel`).
- Functions and variables: camelCase.
- Constants: UPPER_SNAKE for module-level tuning knobs (`REPEAT_MS`, `PER_PAGE`).

## File size
- Code files must stay under 200 lines of code.
- Pure-data files (levels, palettes) are exempt.

## Architecture rules
- **Views** (`src/views/*.svelte`) own layout + user interaction. Each screen is one component, kept under 200 LOC.
- **Core** (`src/lib/core/`) is pure JS — no Svelte imports. Anything that can be unit-tested without a DOM lives here (parser, board model, progress store).
- **Data** (`src/lib/data/`) is framework-agnostic static data.
- `Board.svelte` is purely presentational: plain props in, DOM out. It does not import or touch `BoardModel`.
- `GameView.svelte` owns the mutable `BoardModel` instance and calls `syncFromModel()` after every mutation to reassign the reactive `$state` snapshots that `Board` consumes.
- No new dependencies without updating this doc.

## Style
- Prefer composition over inheritance.
- Fail loudly during development (console.error on unexpected state), fail gracefully at runtime (try/catch around level parsing, progress store).
- Comments: short, explain *why*, not *what*. File headers give a one-sentence purpose.

## Git / commits
- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
- Never commit dotenv, keys, or build artifacts.
- Run `npm run build-nolog` before pushing to catch compile errors.

## Testing strategy (current)
No automated tests yet. Manual smoke test: load menu → play level 1 → complete → verify progress saved in localStorage → reload page → verify completion persists.
Future: unit tests for `level-parser.js` and `board-model.js` (both framework-free JS).
