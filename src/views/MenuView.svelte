<!--
    Menu screen: title, play button, progress counter, control hints.
-->
<script>
    import AppButton from './AppButton.svelte';
    import { progressStore } from '../lib/core/progress-store.js';
    import { MICROBAN_LEVELS } from '../lib/data/microban-levels.js';

    let { onPlay } = $props();

    const total = MICROBAN_LEVELS.length;
    const completed = progressStore.getCompletedCount();
</script>

<section class="screen menu">
    <h1 class="screen-title">SOKOBAN</h1>
    <p class="screen-subtitle">{total} puzzles to solve</p>

    <AppButton size="lg" onclick={onPlay}>PLAY</AppButton>

    <p class="progress">Completed: {completed} / {total}</p>

    <div class="hint">
        <div><strong>Arrow keys</strong> or <strong>WASD</strong> — move</div>
        <div><strong>U</strong> / <strong>Z</strong> — undo &nbsp;·&nbsp; <strong>R</strong> — restart &nbsp;·&nbsp; <strong>Esc</strong> — menu</div>
        <div>Push every box onto a target tile.</div>
    </div>

    <p class="credit">Level layouts from Microban by David W. Skinner</p>
</section>

<style>
    .menu {
        padding-top: 40px;
    }

    .progress {
        color: var(--accent);
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 1px;
    }
</style>
