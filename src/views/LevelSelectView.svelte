<!--
    Paginated level select (20 per page). Shows completion state and
    best-move count per level, navigates with buttons or arrow keys.
-->
<script>
    import AppButton from './AppButton.svelte';
    import { progressStore } from '../lib/core/progress-store.js';
    import { MICROBAN_LEVELS } from '../lib/data/microban-levels.js';

    let { onBack, onSelect } = $props();

    const PER_PAGE = 20;
    const total = MICROBAN_LEVELS.length;
    const totalPages = Math.ceil(total / PER_PAGE);

    let page = $state(0);

    let completedCount = $state(progressStore.getCompletedCount());

    let visibleLevels = $derived.by(() => {
        const start = page * PER_PAGE;
        const end = Math.min(start + PER_PAGE, total);
        const out = [];
        for (let i = start; i < end; i++) {
            out.push({
                index: i,
                done: progressStore.isCompleted(i),
                best: progressStore.getBestMoves(i)
            });
        }
        return out;
    });

    function changePage(delta) {
        const next = Math.max(0, Math.min(totalPages - 1, page + delta));
        page = next;
    }

    function onKey(e) {
        if (e.key === 'Escape') { onBack(); }
        else if (e.key === 'ArrowLeft') { changePage(-1); }
        else if (e.key === 'ArrowRight') { changePage(1); }
    }
</script>

<svelte:window onkeydown={onKey} />

<section class="screen">
    <div class="topbar">
        <AppButton variant="ghost" size="sm" onclick={onBack}>&lt; BACK</AppButton>
        <h2 class="title">SELECT LEVEL</h2>
        <span class="count">{completedCount} / {total}</span>
    </div>

    <div class="grid">
        {#each visibleLevels as level (level.index)}
            <button
                class="level-btn"
                class:done={level.done}
                type="button"
                onclick={() => onSelect(level.index)}
            >
                <span class="level-num">
                    {#if level.done}<span class="check">✓</span>{/if}
                    LEVEL {level.index + 1}
                </span>
                <span class="level-sub">
                    {level.best != null ? `Best: ${level.best}` : 'Not played'}
                </span>
            </button>
        {/each}
    </div>

    <div class="pager">
        <AppButton variant="ghost" size="sm" onclick={() => changePage(-1)} disabled={page === 0}>&lt;</AppButton>
        <span class="page-label">Page {page + 1} / {totalPages}</span>
        <AppButton variant="ghost" size="sm" onclick={() => changePage(1)} disabled={page >= totalPages - 1}>&gt;</AppButton>
    </div>
</section>

<style>
    .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 16px;
    }

    .title {
        font-size: 28px;
        letter-spacing: 2px;
        font-weight: 800;
    }

    .count {
        color: var(--accent);
        font-weight: 700;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 14px;
        width: 100%;
    }

    @media (max-width: 720px) {
        .grid { grid-template-columns: repeat(4, 1fr); }
    }
    @media (max-width: 540px) {
        .grid { grid-template-columns: repeat(3, 1fr); }
    }

    .level-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 16px 8px;
        border: 2px solid var(--border);
        border-radius: var(--radius);
        background: var(--panel);
        color: var(--text);
        font-family: inherit;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease, transform 80ms ease;
    }

    .level-btn:hover {
        background: var(--panel-hover);
        border-color: var(--accent);
    }

    .level-btn:active {
        transform: translateY(1px);
    }

    .level-btn:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
    }

    .level-btn.done {
        border-color: var(--success);
        background: rgba(163, 190, 140, 0.12);
    }

    .level-num {
        font-weight: 800;
        font-size: 15px;
        letter-spacing: 1px;
    }

    .level-sub {
        font-size: 12px;
        color: var(--text-dim);
    }

    .check {
        color: var(--success);
        margin-right: 2px;
    }

    .pager {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .page-label {
        min-width: 110px;
        text-align: center;
        color: var(--text-muted);
        font-size: 14px;
        letter-spacing: 1px;
    }
</style>
