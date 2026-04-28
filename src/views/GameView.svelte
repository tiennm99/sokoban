<!--
    Gameplay screen: parses the current level, holds the BoardModel,
    wires keyboard input, renders HUD + Board + win overlay.
-->
<script>
    import AppButton from './AppButton.svelte';
    import Board from './Board.svelte';
    import DonateModal from './DonateModal.svelte';
    import MobileControls from './MobileControls.svelte';
    import { parseLevel } from '../lib/core/level-parser.js';
    import { BoardModel } from '../lib/core/board-model.js';
    import { progressStore } from '../lib/core/progress-store.js';
    import { pulse } from '../lib/core/haptics.js';
    import { MICROBAN_LEVELS } from '../lib/data/microban-levels.js';

    let { levelIndex, onMenu, onLevels, onNext } = $props();

    // --- Level setup (runs once because GameView is keyed on levelIndex in App) ---
    function buildLevel() {
        try {
            const lv = parseLevel(MICROBAN_LEVELS[levelIndex]);
            if (!lv.player) throw new Error('Level has no player tile');
            return { level: lv, model: new BoardModel(lv), error: null };
        } catch (err) {
            console.error('Failed to load level', levelIndex + 1, err);
            return { level: null, model: null, error: `Failed to load level ${levelIndex + 1}` };
        }
    }

    const built = buildLevel();
    const level = built.level;
    // Non-reactive ref: the BoardModel is mutated internally and reassigned
    // on restart, but re-renders are driven by the $state snapshots below,
    // not by reading model directly in the template.
    let model = built.model;
    let parseError = $state(built.error);

    // Responsive tile size: fill the viewport with a cap so small puzzles
    // don't look comically huge and the two giant finale mazes still fit.
    function computeTileSize() {
        if (!level) return 48;
        const maxTile = 56;
        const minTile = 16;
        // Dock is now in-flow (flex row at bottom); margin only covers header + hud + padding.
        const isCoarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
        // 195 reflects the slimmer mobile chrome after R6+R7 (top-aligned d-pad
        // at 48px arrows). If the dock layout changes, retune this.
        const margin = isCoarse ? 195 : 120; // header + hud (+ in-flow mobile dock) + padding
        const maxByWidth = Math.floor((window.innerWidth - 80) / level.width);
        const maxByHeight = Math.floor((window.innerHeight - margin - 100) / level.height);
        return Math.max(minTile, Math.min(maxTile, maxByWidth, maxByHeight));
    }

    let tileSize = $state(computeTileSize());

    // --- Reactive state: read by Board.svelte ---
    let player = $state(level ? { x: model.player.x, y: model.player.y } : { x: 0, y: 0 });
    let boxes = $state(level
        ? model.boxes.map((b, i) => ({ id: i, x: b.x, y: b.y, onTarget: model.isTarget(b.x, b.y) }))
        : []);
    let moves = $state(0);
    let won = $state(false);
    const best = $derived(progressStore.getBestMoves(levelIndex));

    function syncFromModel() {
        player = { x: model.player.x, y: model.player.y };
        boxes = model.boxes.map((b, i) => ({ id: i, x: b.x, y: b.y, onTarget: model.isTarget(b.x, b.y) }));
        moves = model.moveCount;
        if (model.isSolved() && !won) {
            won = true;
            progressStore.recordCompletion(levelIndex, moves);
            pulse(60);
        }
    }

    function tryMove(dx, dy) {
        if (won || !model) return;
        if (model.tryMove(dx, dy)) {
            // Short buzz when a move pushed a box; plain steps stay silent.
            if (model.history.at(-1)?.movedBox) pulse(10);
            syncFromModel();
        }
    }

    function undo() {
        if (won || !model) return;
        if (model.undo()) syncFromModel();
    }

    function restart() {
        if (!level) return;
        model = new BoardModel(level);
        won = false;
        syncFromModel();
    }

    // --- Keyboard input with a soft repeat gate so held keys feel right ---
    const REPEAT_MS = 130;
    let lastKeyAt = 0;

    function onKey(e) {
        // Don't route gameplay keys while the donate modal is open — its own
        // Escape handler should be the only consumer.
        if (donateOpen) return;
        if (e.key === 'Escape') { onLevels(); return; }
        if (e.key === 'r' || e.key === 'R') { restart(); return; }
        if (e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') { undo(); return; }

        const now = performance.now();
        if (now - lastKeyAt < REPEAT_MS) return;

        let handled = true;
        switch (e.key) {
            case 'ArrowLeft':  case 'a': case 'A': tryMove(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': tryMove(1, 0); break;
            case 'ArrowUp':    case 'w': case 'W': tryMove(0, -1); break;
            case 'ArrowDown':  case 's': case 'S': tryMove(0, 1); break;
            default: handled = false;
        }
        if (handled) {
            lastKeyAt = now;
            e.preventDefault();
        }
    }

    function onResize() {
        tileSize = computeTileSize();
    }

    // Recompute tile size when pointer type changes (e.g. external keyboard
    // attached/detached on iPad), so the bottom-controls reservation matches.
    $effect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(pointer: coarse)');
        const handler = () => onResize();
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    });

    const hasNext = $derived(levelIndex + 1 < MICROBAN_LEVELS.length);

    let donateOpen = $state(false);
</script>

<svelte:window onkeydown={onKey} onresize={onResize} />

<section class="screen game">
    {#if parseError}
        <p class="error">{parseError}</p>
        <AppButton onclick={onMenu}>BACK TO MENU</AppButton>
    {:else}
        <header class="hud">
            <div class="hud-left">
                <div class="level-name">LEVEL {levelIndex + 1}</div>
                <div class="stats">
                    Moves: <strong>{moves}</strong>
                    {#if best != null} &nbsp;·&nbsp; Best: <strong>{best}</strong>{/if}
                </div>
            </div>
            <div class="hud-right desktop-actions">
                <AppButton variant="ghost" size="sm" onclick={undo} title="Undo (U / Z)">UNDO</AppButton>
                <AppButton variant="ghost" size="sm" onclick={restart} title="Restart (R)">RESTART</AppButton>
                <AppButton variant="ghost" size="sm" onclick={onLevels} title="Back to levels (Esc)">LEVELS</AppButton>
            </div>
        </header>

        <div class="play-stack">
            <div class="play-group">
                <div class="board-wrap">
                    <Board
                        width={level.width}
                        height={level.height}
                        walls={level.walls}
                        targets={level.targets}
                        floors={level.floors}
                        {player}
                        {boxes}
                        {tileSize}
                    />
                </div>

                <MobileControls
                    onMove={tryMove}
                    onUndo={undo}
                    onRestart={restart}
                    {onLevels}
                />
            </div>
        </div>

        {#if won}
            <div class="overlay">
                <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="win-title" tabindex="-1">
                    <h2 id="win-title">LEVEL COMPLETE!</h2>
                    <p class="final">Moves: <strong>{moves}</strong></p>
                    <div class="dialog-actions">
                        {#if hasNext}
                            <AppButton onclick={onNext}>NEXT LEVEL</AppButton>
                        {/if}
                        <AppButton variant="ghost" onclick={onLevels}>LEVELS</AppButton>
                    </div>
                    <AppButton variant="ghost" size="sm" onclick={() => (donateOpen = true)} title="Support the game">
                        ☕ BUY ME A COFFEE
                    </AppButton>
                </div>
            </div>
        {/if}
    {/if}
</section>

<DonateModal open={donateOpen} onClose={() => (donateOpen = false)} />

<style>
    .game {
        /* Stretch to #app's inner area (min-height: 100vh minus padding) so
           .board-wrap can flex-grow without forcing page-scroll. */
        align-self: stretch;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .hud {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        flex-wrap: wrap;
        gap: 12px;
    }

    .hud-left { display: flex; flex-direction: column; gap: 2px; }
    .hud-right { display: flex; gap: 8px; flex-wrap: wrap; }

    .level-name {
        font-weight: 800;
        font-size: 22px;
        letter-spacing: 2px;
    }

    .stats {
        font-size: 14px;
        color: var(--text-muted);
    }

    /* Desktop: .play-stack is a passthrough that lets .board-wrap flex-grow
       inside it, matching the previous behavior where the board occupied the
       remaining column space. */
    .play-stack {
        flex: 1 1 auto;
        width: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }

    .play-group {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .board-wrap {
        flex: 1 1 auto;
        width: 100%;
        overflow: auto;
        min-height: 0;
        max-width: calc(100vw - 48px);
    }

    /* On touch devices: hide duplicated header action buttons (MobileControls
       owns its own row at the bottom), tighten the column rhythm, and center
       the [board + 8px gap + dock] group inside the remaining viewport space.
       `safe center` falls through to start-aligned when the group overflows so
       tall finale puzzles don't get clipped above the HUD. */
    @media (pointer: coarse) {
        .desktop-actions { display: none; }

        .game { gap: 10px; }

        .play-stack {
            justify-content: safe center;
        }

        .play-group {
            flex: 0 1 auto;
            gap: 8px;
            max-height: 100%;
        }

        .board-wrap {
            flex: 1 1 auto;
            max-width: calc(100vw - 24px);
            display: flex;
            justify-content: center;
        }
    }

    .error {
        color: var(--danger);
        font-weight: 700;
    }

    /* .overlay + .dialog base lives in app.css; only specific tweaks here. */
    .dialog {
        padding: 32px 40px;
        gap: 16px;
    }

    .dialog h2 {
        font-size: 28px;
        letter-spacing: 2px;
        color: var(--success);
    }

    .final {
        font-size: 16px;
        color: var(--text-muted);
    }

    .dialog-actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;
    }

</style>
