<!--
    Renders a Sokoban board as DOM. Purely presentational — reads only
    plain props so Svelte tracks changes cleanly. Player and boxes use
    CSS transform transitions for animated moves.
-->
<script>
    let {
        width,
        height,
        walls,     // Set<"x,y">
        targets,   // Set<"x,y">
        floors,    // Set<"x,y">
        player,    // { x, y }
        boxes,     // [{ id, x, y, onTarget }]
        tileSize = 48
    } = $props();

    // 8-neighborhood for the wall-trim pass below. Hoisted out of $derived
    // so it isn't reallocated on every reactive recomputation.
    const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]];

    function keyToXY(k) {
        const [x, y] = k.split(',').map(Number);
        return { x, y };
    }

    // Static once-per-render lists derived from the Sets.
    let floorCells = $derived.by(() => {
        const out = [];
        for (const k of floors) {
            const { x, y } = keyToXY(k);
            out.push({ x, y, alt: (x + y) % 2 === 0 });
        }
        return out;
    });

    let targetCells = $derived.by(() => {
        const out = [];
        for (const k of targets) out.push(keyToXY(k));
        return out;
    });

    // Only render walls that touch a floor tile — skips the unused outer border.
    let wallCells = $derived.by(() => {
        const out = [];
        for (const k of walls) {
            const { x, y } = keyToXY(k);
            if (DIRS.some(([dx, dy]) => floors.has(`${x + dx},${y + dy}`))) {
                out.push({ x, y });
            }
        }
        return out;
    });
</script>

<div
    class="board"
    style="--tile: {tileSize}px; width: {width * tileSize}px; height: {height * tileSize}px;"
>
    {#each floorCells as cell (cell.x + ',' + cell.y)}
        <div
            class="floor"
            class:alt={cell.alt}
            style="left: {cell.x * tileSize}px; top: {cell.y * tileSize}px;"
        ></div>
    {/each}

    {#each targetCells as cell (cell.x + ',' + cell.y)}
        <div
            class="target"
            style="left: {cell.x * tileSize}px; top: {cell.y * tileSize}px;"
        ></div>
    {/each}

    {#each wallCells as cell (cell.x + ',' + cell.y)}
        <div
            class="wall"
            style="left: {cell.x * tileSize}px; top: {cell.y * tileSize}px;"
        ></div>
    {/each}

    {#each boxes as box (box.id)}
        <div
            class="box"
            class:done={box.onTarget}
            style="transform: translate({box.x * tileSize}px, {box.y * tileSize}px);"
        ></div>
    {/each}

    <div
        class="player"
        style="transform: translate({player.x * tileSize}px, {player.y * tileSize}px);"
    ></div>
</div>

<style>
    .board {
        position: relative;
        border-radius: var(--radius);
        overflow: hidden;
        background: var(--bg-deep);
        margin: 0 auto;
        /* `manipulation` kills the 300ms double-tap-zoom delay but still lets
           the parent `.board-wrap` pan-scroll for the giant finale levels. */
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
    }

    .floor,
    .target,
    .wall,
    .box,
    .player {
        position: absolute;
        width: var(--tile);
        height: var(--tile);
    }

    .floor {
        background: var(--floor);
    }
    .floor.alt {
        background: var(--floor-alt);
    }

    .target {
        pointer-events: none;
    }
    .target::after {
        content: '';
        position: absolute;
        inset: 30%;
        border: 2px solid var(--target);
        border-radius: 50%;
        background: rgba(235, 203, 139, 0.2);
    }

    .wall {
        background: var(--wall);
        border: 2px solid var(--wall-edge);
        border-radius: var(--radius-sm);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }

    .box {
        background: var(--box);
        border: 3px solid var(--box-edge);
        border-radius: var(--radius-sm);
        box-sizing: border-box;
        transition: transform 110ms ease, background 120ms ease, border-color 120ms ease;
        will-change: transform;
    }
    .box.done {
        background: var(--box-done);
        border-color: var(--box-done-edge);
    }

    .player {
        border-radius: 50%;
        background: var(--player);
        border: 3px solid var(--player-edge);
        box-sizing: border-box;
        transition: transform 110ms ease;
        will-change: transform;
        z-index: 2;
    }
</style>
