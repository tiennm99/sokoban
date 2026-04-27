# Phase 03 — PWA Precache Cleanup + Residual Vuln Override

**Priority:** Low
**Status:** pending
**Effort:** ~S (file deletion + maybe 5 LOC `package.json`)

## Context

- Debugger Issue 2: `public/assets/bg.png` (295 KB) and `public/assets/logo.png` (24 KB) have **zero references** in any source file. Phaser-era leftovers. They match `**/*.png` and end up in the workbox precache, ~73% of the 435 KB precache total.
- Security/Reviewer: after Phase 01 merges 3 dependabot PRs, the remaining vuln chain is `serialize-javascript` (via `@rollup/plugin-terser` via `workbox-build` via `vite-plugin-pwa`). No clean fix without a `vite-plugin-pwa` major downgrade — `npm overrides` is the surgical alternative.

## Out of scope

- Adding meta CSP header (separate hardening pass)
- Replacing icons with hand-crafted maskable variants

## Decision points (need user input)

1. **Delete `public/assets/bg.png` and `logo.png`?**
   - Pros: 320 KB off the precache, faster install, cleaner repo.
   - Risk: extremely low — grep confirms zero references in `src/`, `index.html`, or `public/`. They're Phaser leftovers.
   - **Auto mode policy:** destructive (file deletion); requires explicit confirmation before running.

2. **For residual `serialize-javascript` chain after Phase 01 merges, choose one:**
   - **Option A — Wait & monitor.** Future workbox/vite-plugin-pwa releases bump the chain. `npm audit` lists 1-2 remaining highs in build-only deps. Practical risk near zero.
   - **Option B — `npm overrides`.** Pin `serialize-javascript` to a fixed version via `package.json` overrides. ~3 LOC. Surgical, keeps current major of `vite-plugin-pwa`.
   - **Option C — Major downgrade.** `npm audit fix --force` → `vite-plugin-pwa@0.19.8`. Loses recent features. Not recommended.

   **Recommendation:** Option B if `npm audit` still flags it after Phase 01. Skip if Phase 01 happens to clear it.

## Implementation Steps

### Step 1: Confirm and delete orphan assets

```bash
# Confirm zero references
grep -rIn -E '(bg\.png|logo\.png)' src/ index.html public/ 2>/dev/null || echo "No references found"
# Delete
rm public/assets/bg.png public/assets/logo.png
# Build and verify precache count drops
npm run build
```

### Step 2 (conditional): npm overrides for residual vuln

If `npm audit` after Phase 01 still flags `serialize-javascript`:

```jsonc
// package.json
{
  "overrides": {
    "serialize-javascript": ">=7.0.5"
  }
}
```

Then:

```bash
rm package-lock.json && npm install
npm audit
npm run build
```

Verify `serialize-javascript` chain is silent in `npm audit`.

## Related Code Files

**Modify**
- `package.json` — possibly add `overrides` block

**Delete (with user confirmation)**
- `public/assets/bg.png`
- `public/assets/logo.png`

## Todo

- [ ] User confirms asset deletion
- [ ] Grep confirms zero references
- [ ] Delete bg.png, logo.png
- [ ] Build → verify precache count drops by 2 entries (~320 KB)
- [ ] Run `npm audit` after Phase 01 merges
- [ ] If `serialize-javascript` still flagged: add `overrides` block, regenerate lockfile, verify build + audit
- [ ] Commit + push

## Success Criteria

- Workbox precache drops below 250 KB total
- `npm audit` flags zero highs in app deps (build-only deps OK if documented)
- Game still works in browser (assets weren't actually used — verify by running dev server post-delete)

## Risks

| Risk | Mitigation |
|------|------------|
| One of the orphan PNGs is referenced from a CSS we missed | Grep across all files, not just src/. Test build after delete. |
| `npm overrides` causes peer-dep mismatch | Run `npm install` and check warnings; rollback by removing the block if needed |
| User actually wants to keep bg.png for future use | Skip Step 1 — the precache cost is the only real downside |

## Next

- Plan complete → archive via `/ck:plan archive` to journal
