/**
 * XSB Sokoban level parser.
 * Converts a raw XSB string into a structured level:
 *   { width, height, walls, targets, boxes, player, floors }
 * Coordinates are {x, y} grid cells (0-indexed).
 * `floors` is the set of reachable tiles inside the puzzle (flood-fill
 * from the player), so the renderer only paints floor inside the level.
 */

const WALL = '#';
const FLOOR = ' ';
const TARGET = '.';
const BOX = '$';
const BOX_ON_TARGET = '*';
const PLAYER = '@';
const PLAYER_ON_TARGET = '+';

const key = (x, y) => `${x},${y}`;

function parseGrid(xsb) {
    const lines = xsb.split('\n').filter(l => l.length > 0 && !l.startsWith(';'));
    const width = lines.reduce((max, l) => Math.max(max, l.length), 0);
    return { lines, width, height: lines.length };
}

function extractEntities(lines, width, height) {
    const walls = new Set();
    const targets = new Set();
    const boxes = [];
    let player = null;

    for (let y = 0; y < height; y++) {
        const row = lines[y];
        for (let x = 0; x < width; x++) {
            const ch = row[x] || ' ';
            switch (ch) {
                case WALL:
                    walls.add(key(x, y));
                    break;
                case TARGET:
                    targets.add(key(x, y));
                    break;
                case BOX:
                    boxes.push({ x, y });
                    break;
                case BOX_ON_TARGET:
                    boxes.push({ x, y });
                    targets.add(key(x, y));
                    break;
                case PLAYER:
                    player = { x, y };
                    break;
                case PLAYER_ON_TARGET:
                    player = { x, y };
                    targets.add(key(x, y));
                    break;
            }
        }
    }

    return { walls, targets, boxes, player };
}

function floodFillFloors(player, walls, width, height) {
    const floors = new Set();
    if (!player) return floors;
    const stack = [player];
    while (stack.length) {
        const { x, y } = stack.pop();
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const k = key(x, y);
        if (floors.has(k) || walls.has(k)) continue;
        floors.add(k);
        stack.push({ x: x + 1, y });
        stack.push({ x: x - 1, y });
        stack.push({ x, y: y + 1 });
        stack.push({ x, y: y - 1 });
    }
    return floors;
}

export function parseLevel(xsb) {
    const { lines, width, height } = parseGrid(xsb);
    const { walls, targets, boxes, player } = extractEntities(lines, width, height);
    const floors = floodFillFloors(player, walls, width, height);
    return { width, height, walls, targets, boxes, player, floors };
}

export { key as cellKey };
