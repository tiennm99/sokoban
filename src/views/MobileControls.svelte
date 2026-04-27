<!--
    Touch-only on-screen controls. Hidden on desktop via @media (pointer: coarse).
    Bottom-left action stack (UNDO / RESTART / LEVELS), bottom-right D-pad.
    Tap-only — no auto-repeat. Calls back into GameView with plain handlers.
-->
<script>
    let { onMove, onUndo, onRestart, onLevels } = $props();
</script>

<div class="dock-left">
    <button class="action" type="button" onclick={onUndo} aria-label="Undo">UNDO</button>
    <button class="action" type="button" onclick={onRestart} aria-label="Restart">RESET</button>
    <button class="action" type="button" onclick={onLevels} aria-label="Levels">LVLS</button>
</div>

<div class="dpad">
    <button class="arrow up"    type="button" onclick={() => onMove(0, -1)} aria-label="Up">▲</button>
    <button class="arrow left"  type="button" onclick={() => onMove(-1, 0)} aria-label="Left">◀</button>
    <button class="arrow right" type="button" onclick={() => onMove(1, 0)}  aria-label="Right">▶</button>
    <button class="arrow down"  type="button" onclick={() => onMove(0, 1)}  aria-label="Down">▼</button>
</div>

<style>
    /* Hidden by default. Coarse-pointer (touch) devices only. */
    .dock-left,
    .dpad {
        display: none;
    }

    @media (pointer: coarse) {
        .dock-left {
            position: fixed;
            bottom: calc(12px + env(safe-area-inset-bottom));
            left: calc(12px + env(safe-area-inset-left));
            display: flex;
            flex-direction: column;
            gap: 8px;
            z-index: 50;
        }

        .dpad {
            position: fixed;
            bottom: calc(12px + env(safe-area-inset-bottom));
            right: calc(12px + env(safe-area-inset-right));
            display: grid;
            grid-template-columns: 56px 56px 56px;
            grid-template-rows: 56px 56px;
            grid-template-areas:
                ".    up   .   "
                "left down right";
            gap: 4px;
            z-index: 50;
        }
    }

    .action {
        min-width: 64px;
        height: 44px;
        padding: 0 12px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1px;
        font-family: inherit;
        color: var(--text);
        background: var(--panel);
        border: 2px solid var(--border);
        border-radius: var(--radius);
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
    }

    .arrow {
        font-size: 22px;
        font-family: inherit;
        color: var(--text);
        background: var(--panel);
        border: 2px solid var(--accent);
        border-radius: var(--radius);
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
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
