# Mobile UX Review — Footer Mistouch on `miti99.com` Link

**Date:** 2026-04-28
**Scope:** Sokoban Svelte 5 — mobile gameplay footer mistouch bug
**Files reviewed:** `src/App.svelte`, `src/views/MobileControls.svelte`, `src/views/GameView.svelte`, `src/app.css`, `index.html`

---

## TL;DR

Footer link sits exactly on top of the mobile D-pad / action stack on small screens. Footer is `position: fixed; bottom: 6px` while D-pad and action stack are `bottom: calc(12px + safe-area-inset-bottom)`. Both render in the same vertical band (~6px–112px from viewport bottom). Even though footer wrapper has `pointer-events: none`, the `<a>` re-enables `pointer-events: auto` and sits above nothing — but importantly, it sits in the gap **between** the dock-left action stack and the D-pad (centered text), where users' thumbs swipe between Undo/Reset and the arrows. Mistouches happen on the centered link text directly.

Also: footer ignores `safe-area-inset-bottom`, so on iPhones with home indicator the link can collide with the system gesture bar too.

**Recommendation:** Hide footer on `view === 'game'` (Option A — KISS, ships in 2 lines). All other options are layered nice-to-haves.

---

## Diagnosis

### 1. Geometric overlap (the bug)

Measurements at default 16px root font:

| Element | Bottom anchor | Approx height | Top edge from viewport bottom |
|---|---|---|---|
| Footer text | `bottom: 6px` | ~14px (12px font + line) | ~6px–20px |
| Footer `<a>` (`miti99`) | centered horizontally | ~14px tall, ~50px wide | same band as above |
| D-pad | `bottom: 12px + safe-area` | 116px (2×56 + 4 gap) | ~12px–128px (right side) |
| Action stack | `bottom: 12px + safe-area` | 148px (3×44 + 2×8 gap) | ~12px–160px (left side) |

The footer link sits in the **horizontal center**, between the action stack (left) and D-pad (right). On phones 360–414px wide:
- Action stack right edge: ~12 + 64 = **76px from left**
- D-pad left edge: viewport_width − 12 − 172 = **viewport_width − 184px from left**
- Center gap on a 390px iPhone 13: **76px to 206px** — that's a 130px wide horizontal corridor where the footer link lives.

The link is centered around viewport mid (~195px on 390px wide), and reaches into the **vertical** band of both controls (6–20px from bottom). The action stack and D-pad both extend **down to 12px from bottom**, so the footer is just 6px above the bottoms of both controls.

**Mistouch scenario:** User's thumb is repeatedly tapping bottom-row D-pad arrows (Down/Left/Right at `bottom: 12px`). A slightly off thumb that lands on the link instead — or a swipe from D-pad bottom edge towards the action stack — hits the footer link and yanks them off to `miti99.com` in a new tab.

### 2. Target size violation (WCAG 2.5.5 AA / 2.5.8 AAA)

Footer link `<a>` has:
- `font-size: 12px`
- No `padding`, no `min-height`, no `min-width`
- Effective hit area: ~50×14px

WCAG 2.5.5 (Level AAA) and 2.5.8 (Level AA, WCAG 2.2): minimum **24×24 CSS px** target size, recommended **44×44** (Apple HIG) / **48×48dp** (Material). This link is **~4× too short** vertically.

A 14px-tall target near the dominant thumb zone is a finger trap.

### 3. Footer purpose vs. context

Footer is decorative attribution — `Made with ♥ by miti99`. It is global (rendered in `App.svelte` outside the view router), so it appears on:
- Menu (desired — branding)
- Levels (acceptable — branding)
- Game (problematic — overlaps controls, no informational value during play)

YAGNI: footer adds zero value during active gameplay. Author credit belongs on menu/about screens.

### 4. Safe-area neglect

`bottom: 6px` does not include `env(safe-area-inset-bottom)`. On iPhone X+ portrait the home-indicator gesture bar lives in the bottom ~34px, so the footer text is **drawn underneath the gesture bar** — invisible or partially clipped, and any tap there fights the iOS system gesture (swipe-up to home). Even worse, the link is rendered into a region the user is conditioned to swipe through.

### 5. Other mobile UX issues spotted

- **`MobileControls` action buttons (`UNDO / RESET / LVLS`) are `min-width: 64px; height: 44px`** — meet 44×44 minimum but are stacked at `gap: 8px`. Reset is between Undo and Lvls. A mis-tap on Reset wipes progress with no confirmation. Suggest adding a tap-to-confirm or a 2s "tap again to confirm reset" pattern.
- **D-pad missing center button** — grid has empty `down` cell only when laid out as defined. Looking again: the grid is `". up ." / "left down right"` — that's fine, no overlapping cells. But arrow buttons have **no explicit `width`/`height`** other than the grid cell (56×56). Visual size matches WCAG; OK.
- **No auto-repeat on D-pad** — comment says "Tap-only — no auto-repeat." Long pushes through corridors require many discrete taps. Consider press-and-hold repeat at REPEAT_MS=130 (already used for keyboard) for parity. Optional, not the bug.
- **Board overflow uses `overflow: auto`** which on mobile creates a scrollable area inside the viewport. Combined with `touch-action: manipulation` on buttons but not on board, two-finger zoom and pan inside board are possible — could be intentional for very large mazes.
- **Header `desktop-actions` already hidden on coarse pointer** — good. But level name and stats wrap at small width; level name is 22px and could be 18px on phones to save vertical room.
- **Win overlay buttons** — fine, modal centered, large hit areas.
- **`<svelte:window onkeydown={onKey}>`** — fine for keyboard. No mobile-specific concern.
- **`-webkit-tap-highlight-color: transparent` globally** — removes the blue flash, which is good for game feel but reduces perceived feedback on the footer link. Combined with no `:active` style on the link, taps feel like nothing happened — until a new tab pops open. Reinforces the "wait, I didn't mean to" reaction.

---

## Fix Proposals (ranked simple → involved)

### Option A — Hide footer during gameplay (recommended)

**Change:** Move `<footer>` rendering inside the `{#if view === 'menu' || view === 'levels'}` branches, or add `{#if view !== 'game'}` guard around it in `App.svelte`.

**Pros:**
- 2-line change. KISS / YAGNI.
- Eliminates the bug entirely on the screen where it matters.
- Branding still shown on menu and level select where players land.
- No CSS gymnastics, no z-index battles.

**Cons:**
- Loses attribution on the game screen. Acceptable — attribution belongs on menu.
- Doesn't fix the WCAG target-size issue on menu/levels (still 12px, ~14px tall). Low risk there because no overlapping controls, but link is still small.

**Code sketch:**
```svelte
{#if view !== 'game'}
  <footer class="site-footer"> ... </footer>
{/if}
```

---

### Option B — Move footer above the controls + enlarge hit area

**Change:**
- Bump footer to `bottom: calc(140px + env(safe-area-inset-bottom))` on coarse pointer (above the D-pad/action stack).
- Add `padding: 8px 16px; display: inline-block` to the `<a>` to hit ~30px tall × 80px wide.
- Add `:active` state for tap feedback.

**Pros:**
- Keeps attribution visible everywhere.
- Improves WCAG compliance.

**Cons:**
- Footer floating mid-screen above controls looks awkward and steals visual focus from the puzzle.
- Still risks overlap with the win overlay close zone.
- More CSS than Option A and doesn't reduce surface area for mistouches as much as removing it does.

---

### Option C — Footer on menu/levels only, plus credit line in game HUD

**Change:**
- Apply Option A (hide footer in game view).
- Add a small `Made by miti99` line inside the win modal (or in the menu's existing credit area).

**Pros:**
- Branded everywhere it makes sense, never in the way during play.
- Win modal is a natural moment for attribution + donate CTA (donate modal already there).

**Cons:**
- Slight extra work (~10 lines).
- Two places to maintain credit.

---

### Option D — Keep footer, make it non-interactive during gameplay

**Change:** When `view === 'game'`, render footer with `pointer-events: none` on **both** wrapper and `<a>` (override the `pointer-events: auto`). Visually visible, totally untappable.

**Pros:**
- Branding stays visible. Zero mistouches because nothing is clickable.

**Cons:**
- Defeats the purpose of having a link. Why show a link nobody can tap?
- Footer text still overlaps gesture bar / safe area on iPhone — visual clutter unaddressed.
- Worst of both worlds: present but useless.

---

## Recommendation

**Ship Option A.** It is the smallest, safest fix and addresses the root cause (footer in the gameplay zone serves no purpose). If branding-during-play is desired later, layer Option C on top.

Independently, two follow-ups regardless of choice:
1. Add `bottom: calc(6px + env(safe-area-inset-bottom))` to `.site-footer` so the menu/levels footer respects the iPhone home indicator.
2. Increase footer link tap padding (`padding: 6px 10px`) so the menu/levels link meets 24×24 minimum target size.

---

## Unresolved Questions

1. Is `miti99.com` link a hard requirement on every screen (sponsorship/license/contractual)? If yes, Option B or C; if not, Option A.
2. Do telemetry / referrer logs show how many `miti99.com` clicks come from mobile vs. desktop? High mobile rate would confirm the mistouch theory empirically.
3. Should Reset action gain a confirm-tap given it is adjacent to Undo? Out of scope for this bug but flagged as a related risk.
4. Press-and-hold auto-repeat on D-pad — desired, or intentionally tap-only for puzzle thinking time?

---

**Status:** DONE
**Summary:** Diagnosed mistouch as overlap of fixed footer link with mobile D-pad/action-stack tap zones plus WCAG target-size violation; recommended Option A (hide footer on game view) as KISS fix, with Options B/C/D listed for tradeoff comparison.
