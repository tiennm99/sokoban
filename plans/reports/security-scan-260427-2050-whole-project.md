# Security Scan — Whole Project

- Date: 2026-04-27
- Project: Sokoban (Svelte 5 + Vite, static, GH Pages)
- Scope: secret detection, dependency audit, OWASP code patterns, .env exposure

## Summary

| Category | Critical | High | Medium | Low |
|----------|---------:|-----:|-------:|----:|
| Secrets  | 0 | 0 | 0 | 0 |
| Deps (build-only) | 0 | 4 | 2 | 0 |
| Code     | 0 | 0 | 0 | 0 |
| .env     | 0 | 0 | 0 | 0 |

## 1. Secret detection — clean

Grep across `*.js, *.mjs, *.svelte, *.json, *.html, *.css` (excluding `node_modules`, `dist`, `.git`) for AWS keys, GitHub tokens, Stripe keys, Slack tokens, hardcoded passwords/api_keys/secrets. **Zero matches.**

## 2. .env exposure — clean

- No `.env`, `.env.local`, `.env.production` tracked by git.
- `.gitignore` excludes `node_modules`, `dist`, `*.local`.
- (Note: `.gitignore` line 11 is a stray `.` — harmless but should be removed for tidiness.)

## 3. Code patterns — clean

No matches for: `innerHTML`, `dangerouslySetInnerHTML`, `eval(`, `new Function(`, `document.write`, Svelte `{@html}`, `Math.random` for security, `crypto.` misuse.

The project takes only keyboard/touch events; no DOM injection of user-supplied strings; no fetch/XHR; no dynamic script eval. localStorage I/O is fully wrapped in try/catch.

## 4. Dependency audit — all build-only, not exploitable in this codebase

`npm audit` reports 8 vulnerabilities (1 high in direct dep `vite-plugin-pwa`, plus 7 transitive). All are **dev tooling** that never ships to the browser bundle:

| Package | Severity | CVE / GHSA | Why not exploitable here |
|---------|----------|------------|--------------------------|
| `vite-plugin-pwa` (direct) | High | rolls up the below | only runs at `npm run build` time on developer/CI machine |
| `workbox-build` | High | via plugin-terser | build-time only |
| `@rollup/plugin-terser` | High | via serialize-javascript | build-time only |
| `serialize-javascript` <7.0.5 | High | GHSA-5c6j-r48x-rmvq (RCE via RegExp.flags) | requires attacker-controlled input; workbox serializes our own precache manifest of glob-matched local files |
| `serialize-javascript` <7.0.5 | Mod | GHSA-qj8w-gfj5-8c6v (CPU DoS) | same — local trusted input |
| `rollup` 4.0.0–4.58.0 | High | GHSA-mw96-cpmx-2vgc (path traversal) | requires malicious config; we own all config |
| `postcss` <8.5.10 | Mod | GHSA-qx2v-qp2m-jg93 (XSS in CSS stringify) | requires attacker-controlled CSS source; our CSS is hand-written and static |
| `picomatch` 4.0.0–4.0.3 | High | GHSA-c2c7-rcm5-vvqj (ReDoS in extglob) + GHSA-3v7f-55p6-f55p | requires attacker-controlled glob; we own all globs in vite config |

### Recommendation

`npm audit fix` won't auto-resolve because the only listed fix path is a **major downgrade** of `vite-plugin-pwa` to 0.19.8, which would lose recent features and the current API.

Better paths in priority order:
1. **Wait & monitor** — workbox/vite-plugin-pwa maintainers regularly bump transitive deps. Re-run audit weekly. Practical risk for a static GH Pages site is near-zero.
2. **`npm audit fix --force`** — only if comfortable with the major downgrade. Test the build afterward.
3. **`npm dedupe`** + manual `overrides` in package.json — pin `picomatch`, `postcss`, `rollup`, `serialize-javascript` to fixed versions via npm `overrides`. Surgical, keeps current `vite-plugin-pwa` major. About 5 lines of package.json.

## 5. Runtime security posture

| Concern | Status |
|---------|--------|
| XSS | No DOM injection of user data. No `{@html}`. |
| CSRF | N/A — no backend, no cookies, no auth. |
| Clickjacking | N/A — game is the whole page; no embed-target value. (Could add `frame-ancestors` CSP header server-side, but GH Pages doesn't let you set headers.) |
| localStorage poisoning | `progressStore` reads through try/catch and treats malformed JSON as empty state. |
| Service worker scope creep | `scope: '/sokoban/'` correctly bounds SW to project base path. |
| Subresource integrity | Not used; all assets are self-hosted under `/sokoban/`. No CDN. SRI only meaningful for external scripts. |
| HTTPS | Enforced by GitHub Pages. |
| Content Security Policy | Not set. GH Pages doesn't allow custom HTTP headers, but a `<meta http-equiv="Content-Security-Policy">` could be added (e.g. `default-src 'self'; img-src 'self' data:`) — low priority hardening, not urgent. |

## Recommendations (prioritized)

1. **Add `npm overrides`** for the four transitive dev deps (rollup, picomatch, postcss, serialize-javascript) — clears the vulnerability list without forcing a vite-plugin-pwa major downgrade.
2. **Optional**: add a meta CSP for defense-in-depth: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; manifest-src 'self'">`. (`'unsafe-inline'` for styles is needed because Vite injects scoped CSS inline.)
3. **Tidy `.gitignore`** — remove the stray `.` on line 11.

## Unresolved questions

- Is the `vite-plugin-pwa` major-version downgrade (option 2 above) acceptable to the user, or should we go with `npm overrides` (option 3)?
- Should the meta CSP be added now, or deferred?
