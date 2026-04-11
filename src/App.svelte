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
