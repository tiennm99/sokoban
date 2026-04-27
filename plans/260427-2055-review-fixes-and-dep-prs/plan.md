---
title: Review Fixes & Dependabot PRs
date: 2026-04-27
status: pending
branch: main
mode: fast
blockedBy: []
blocks: []
---

# Review Fixes & Dependabot PRs

Address the deferred items from the whole-project review pass and triage the 3 open dependabot PRs (all marked MERGEABLE).

## Goal

Close out review findings: ship the modal a11y polish, the simplifier wins worth doing, the PWA precache cleanup, and merge the dep bumps so `npm audit` is mostly clean. No new feature work.

## Phases

| # | File | Title | Status | Independently shippable |
|---|------|-------|--------|-------------------------|
| 01 | [phase-01-dependabot-prs.md](phase-01-dependabot-prs.md) | Triage & merge dependabot PRs | pending | Yes |
| 02 | [phase-02-modal-a11y-and-hygiene.md](phase-02-modal-a11y-and-hygiene.md) | Modal a11y + simplifier hygiene wins | pending | Yes |
| 03 | [phase-03-pwa-cleanup.md](phase-03-pwa-cleanup.md) | PWA precache cleanup + residual vuln override | pending | Yes (needs user confirm for asset deletion) |

## Open dependabot PRs (snapshot 2026-04-27 20:55)

| # | Title | Mergeable | Fixes |
|---|-------|-----------|-------|
| 7 | postcss 8.5.3 → 8.5.12 | YES | GHSA-qx2v-qp2m-jg93 (XSS in CSS stringify) |
| 5 | rollup 4.40.0 → 4.60.2 | YES | GHSA-mw96-cpmx-2vgc (path traversal) |
| 4 | picomatch 4.0.2 → 4.0.4 | YES | GHSA-c2c7-rcm5-vvqj (ReDoS) + GHSA-3v7f-55p6-f55p |

Each is a transitive devDep — no app code change. Build must still pass after each merge.

## Reports

- [code-reviewer-260427-2036-whole-project-review.md](../reports/code-reviewer-260427-2036-whole-project-review.md)
- [code-simplifier-260427-2036-whole-project-audit.md](../reports/code-simplifier-260427-2036-whole-project-audit.md)
- [debugger-260427-2040-project-health.md](../reports/debugger-260427-2040-project-health.md)
- [security-scan-260427-2050-whole-project.md](../reports/security-scan-260427-2050-whole-project.md)

## Out of scope

- Adding meta CSP header (separate hardening pass)
- Reducing GameView.svelte below 200 LOC (simplifier said leave as-is)
- Most simplifier proposals (small, deferred)
- New features

## Success Criteria

- 3 dependabot PRs merged (or closed if our lockfile already satisfies the bump after rebase)
- `npm audit` shows zero high vulns or only the unfixable `serialize-javascript` chain (with documented `overrides` if we choose that route)
- DonateModal auto-focuses CLOSE button on open and restores prior focus on close
- Win + DonateModal share overlay/dialog CSS (no duplication)
- Build clean throughout
- Desktop and mobile gameplay unchanged
