<!--
    Touch-only on-screen controls. Hidden on desktop via @media (pointer: coarse).
    In-flow bottom row: action stack on the left (UNDO / RESET / LVLS), D-pad on the right.
    RESET is two-tap armed (mobile only) to prevent destructive mis-taps.
    Arrow buttons fire on pointerdown and auto-repeat at 130ms while held.
-->
<script>
    const REPEAT_MS = 130;
    const ARM_MS = 2000;

    let { onMove, onUndo, onRestart, onLevels } = $props();

    // Press-and-hold repeat shared across all four arrows. Last-press wins.
    let holdTimer = null;

    function startHold(dx, dy) {
        onMove(dx, dy);
        clearInterval(holdTimer);
        holdTimer = setInterval(() => onMove(dx, dy), REPEAT_MS);
    }
    function endHold() {
        clearInterval(holdTimer);
        holdTimer = null;
    }

    // RESET arming: first tap arms (visual delta), second tap within ARM_MS resets.
    let resetArmed = $state(false);
    let armTimer = null;

    function disarm() {
        resetArmed = false;
        armTimer = null;
    }

    function handleReset() {
        if (resetArmed) {
            clearTimeout(armTimer);
            disarm();
            onRestart();
            return;
        }
        resetArmed = true;
        clearTimeout(armTimer);
        armTimer = setTimeout(disarm, ARM_MS);
    }

    // Defensive cleanup on unmount.
    $effect(() => () => {
        clearInterval(holdTimer);
        clearTimeout(armTimer);
    });
</script>

<div class="mobile-dock">
    <div class="dock-left">
        <button class="action" type="button" onclick={onUndo} aria-label="Undo">UNDO</button>
        <button
            class="action"
            class:armed={resetArmed}
            type="button"
            onclick={handleReset}
            aria-label={resetArmed ? 'Tap again to confirm reset' : 'Reset'}>
            {resetArmed ? 'TAP AGAIN' : 'RESET'}
        </button>
        <button class="action" type="button" onclick={onLevels} aria-label="Levels">LVLS</button>
    </div>

    <div class="dpad">
        <button
            class="arrow up"
            type="button"
            onpointerdown={(e) => { e.preventDefault(); startHold(0, -1); }}
            onpointerup={endHold}
            onpointercancel={endHold}
            onpointerleave={endHold}
            aria-label="Up">▲</button>
        <button
            class="arrow left"
            type="button"
            onpointerdown={(e) => { e.preventDefault(); startHold(-1, 0); }}
            onpointerup={endHold}
            onpointercancel={endHold}
            onpointerleave={endHold}
            aria-label="Left">◀</button>
        <button
            class="arrow right"
            type="button"
            onpointerdown={(e) => { e.preventDefault(); startHold(1, 0); }}
            onpointerup={endHold}
            onpointercancel={endHold}
            onpointerleave={endHold}
            aria-label="Right">▶</button>
        <button
            class="arrow down"
            type="button"
            onpointerdown={(e) => { e.preventDefault(); startHold(0, 1); }}
            onpointerup={endHold}
            onpointercancel={endHold}
            onpointerleave={endHold}
            aria-label="Down">▼</button>
    </div>
</div>

<style>
    /* Hidden by default. Coarse-pointer (touch) devices only. */
    .mobile-dock {
        display: none;
    }

    @media (pointer: coarse) {
        /* stretch lets each column choose its own cross-axis position so the
           D-pad can hug the dock top (closer to board) while the action stack
           stays bottom-anchored (closer to thumb). */
        .mobile-dock {
            display: flex;
            justify-content: space-between;
            align-items: stretch;
            gap: 12px;
            width: 100%;
            padding:
                0
                calc(12px + env(safe-area-inset-right))
                calc(20px + env(safe-area-inset-bottom))
                calc(12px + env(safe-area-inset-left));
            box-sizing: border-box;
        }

        /* Action buttons mirror the d-pad as a 2-row grid:
             row 1: UNDO + RESET (matches UP row)
             row 2: LVLS spans both columns (matches LEFT/DOWN/RIGHT row)
           Both columns share the same row heights / gap so action and arrow
           rows line up on the same Y. */
        .dock-left {
            display: grid;
            grid-template-columns: auto auto;
            grid-auto-rows: 48px;
            gap: 6px;
            align-self: flex-start;
        }

        .dock-left .action:nth-child(3) {
            grid-column: 1 / -1;
        }

        .dpad {
            display: grid;
            grid-template-columns: 48px 48px 48px;
            grid-template-rows: 48px 48px;
            grid-template-areas:
                ".    up   .   "
                "left down right";
            gap: 6px;
            align-self: flex-start;
        }

        /* Match arrow height for grid-row alignment between action stack
           and d-pad. Still well above the 44pt HIG minimum. */
        .action { height: 48px; }
    }

    /* Landscape phones: dock becomes a narrow right column. Action stack
       sits at the top, d-pad at the bottom so the arrows land in the
       natural thumb arc for a two-handed grip. */
    @media (pointer: coarse) and (orientation: landscape) {
        .mobile-dock {
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            width: 160px;
            gap: 12px;
            padding:
                12px
                calc(8px + env(safe-area-inset-right))
                calc(12px + env(safe-area-inset-bottom))
                8px;
        }

        /* Override portrait's align-self: flex-start; in column layout the
           cross axis is horizontal and we want the d-pad centered. */
        .dpad { align-self: center; }
        .dock-left { align-self: center; }
    }

    /* Global `button` rules (touch-action, tap-highlight) live in app.css. */
    .action {
        min-width: 64px;
        height: 44px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1px;
        color: var(--text);
        background: var(--panel);
        border: 2px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
    }

    .action.armed {
        background: var(--danger);
        color: #fff;
        border-color: var(--danger);
    }

    .arrow {
        font-size: 22px;
        color: var(--text);
        background: var(--panel);
        border: 2px solid var(--accent);
        border-radius: var(--radius);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
    }

    .arrow.up    { grid-area: up; }
    .arrow.down  { grid-area: down; }
    .arrow.left  { grid-area: left; }
    .arrow.right { grid-area: right; }

    .action:active,
    .arrow:active {
        background: var(--panel-hover);
        transform: translateY(1px);
    }
</style>
