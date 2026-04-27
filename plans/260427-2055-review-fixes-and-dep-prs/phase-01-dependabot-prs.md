# Phase 01 — Triage & Merge Dependabot PRs

**Priority:** High
**Status:** pending
**Effort:** ~S (3 PRs, all transitive devDeps, all MERGEABLE)

## Context

3 open dependabot PRs against `tiennm99/sokoban` main:

| # | Bump | Fixes |
|---|------|-------|
| 7 | postcss 8.5.3 → 8.5.12 | GHSA-qx2v-qp2m-jg93 |
| 5 | rollup 4.40.0 → 4.60.2 | GHSA-mw96-cpmx-2vgc |
| 4 | picomatch 4.0.2 → 4.0.4 | GHSA-c2c7-rcm5-vvqj + GHSA-3v7f-55p6-f55p |

All transitive devDeps. None ship to browser. Each PR touches `package-lock.json` only.

## Risks

- **Lockfile rebase**: when we regenerated `package-lock.json` during the earlier rebase, our local versions may already be ≥ the dependabot target. In that case dependabot will auto-close on push, or `gh pr merge` will succeed as a no-op. Either is fine.
- **Conflict with our lockfile**: possible since we just touched it. PR mergeable status is reported as YES (snapshot 20:55), but verify per-PR before merge.
- **Build break**: rollup major bump (4.40 → 4.60) is the highest risk; verify `npm run build` after each merge.

## Implementation Steps

1. Snapshot current versions:
   ```bash
   npm ls postcss rollup picomatch 2>&1 | head -20
   ```
2. For each PR (in order: #4 → #5 → #7, smallest blast radius first):
   - `gh pr view <num> --json mergeable,mergeStateStatus`
   - If mergeable + clean: `gh pr merge <num> --squash --auto` (or `--merge` if user prefers; squash keeps history clean for transitive bumps)
   - If conflict: `gh pr comment <num> --body "Conflicts with current lockfile after recent rebase. Closing — local has acceptable version."` then close
3. After each merge: `git pull --rebase`, then `npm run build`, expect green.
4. After all PRs: `npm audit` → confirm postcss/rollup/picomatch chains are gone. Note any remaining vulns (expected: serialize-javascript via @rollup/plugin-terser via workbox-build via vite-plugin-pwa).

## Decision tree per PR

```
Is PR mergeable?
├── YES + clean
│   └── gh pr merge --squash → pull → build → next
├── MERGEABLE but lockfile-stale
│   └── Local already at target version → close PR with comment
└── CONFLICT
    └── Close PR with comment; rely on next dependabot run
```

## Todo

- [ ] Snapshot current versions of postcss, rollup, picomatch
- [ ] Triage PR #4 (picomatch)
- [ ] Triage PR #5 (rollup)
- [ ] Triage PR #7 (postcss)
- [ ] Pull main after each merge
- [ ] Build verification after each merge
- [ ] Final `npm audit` — note residual vulns

## Success Criteria

- All 3 dependabot PRs are either merged or closed-with-comment (not stuck)
- `npm run build` passes after each merge
- `npm audit` shows reduced or unchanged vuln count, never increased

## Next

- Phase 02: modal a11y + simplifier hygiene wins
