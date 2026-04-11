# Code Standards

## Language & Toolchain
- ES modules, modern JS (no TypeScript).
- Phaser 3.88+.
- Vite as build tool. Dev: `npm run dev`. Prod: `npm run build`.

## Naming
- Files: **kebab-case** with descriptive names (`board-renderer.js`, `progress-store.js`).
- Classes: PascalCase (`BoardModel`, `BoardRenderer`).
- Functions and variables: camelCase.
- Constants: UPPER_SNAKE for module-level tuning knobs (`KEY_REPEAT_MS`, `PER_PAGE`).

## File size
- Code files must stay under 200 lines of code.
- Pure-data files (levels, palettes) are exempt.

## Architecture rules
- **Scenes** own lifecycle + layout; they delegate drawing to renderers and logic to models.
- **Core** (`core/`) is pure JS — no Phaser imports. Anything that can be unit-tested without a canvas lives here.
- **UI** (`ui/`) is Phaser-specific but scene-agnostic — reusable widgets and renderers.
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
Future: unit tests for `level-parser.js` and `board-model.js` (both Phaser-free).
