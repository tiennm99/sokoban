<!--
    Root component: tiny view router. Holds the active view and selected
    level index, swaps between the three screens. GameView is keyed on
    levelIndex so changing levels remounts it with fresh state.
-->
<script>
    import MenuView from './views/MenuView.svelte';
    import LevelSelectView from './views/LevelSelectView.svelte';
    import GameView from './views/GameView.svelte';

    let view = $state('menu'); // 'menu' | 'levels' | 'game'
    let levelIndex = $state(0);

    function goMenu()      { view = 'menu'; }
    function goLevels()    { view = 'levels'; }
    function playLevel(i)  { levelIndex = i; view = 'game'; }
</script>

{#if view === 'menu'}
    <MenuView onPlay={goLevels} />
{:else if view === 'levels'}
    <LevelSelectView onBack={goMenu} onSelect={playLevel} />
{:else}
    {#key levelIndex}
        <GameView
            {levelIndex}
            onMenu={goMenu}
            onLevels={goLevels}
            onNext={() => playLevel(levelIndex + 1)}
        />
    {/key}
{/if}

{#if view !== 'game'}
    <footer class="site-footer">
        Made with <span class="heart">♥</span> by
        <a href="https://miti99.com" target="_blank" rel="noopener noreferrer">miti99</a>
    </footer>
{/if}

<style>
    .site-footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: calc(6px + env(safe-area-inset-bottom));
        text-align: center;
        font-size: 12px;
        color: var(--text-dim);
        letter-spacing: 0.5px;
        pointer-events: none;
        z-index: 1;
    }

    .site-footer a {
        color: var(--accent);
        text-decoration: none;
        font-weight: 700;
        pointer-events: auto;
    }

    .site-footer a:hover {
        text-decoration: underline;
    }

    .heart {
        color: var(--danger);
        display: inline-block;
        animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.2); }
    }
</style>
