/**
 * Board model: pure game state for a Sokoban level.
 * Tracks player position, box positions, move history, and win condition.
 * No rendering, no Phaser — just logic so scenes can react to state changes.
 */

import { cellKey } from './level-parser.js';

export class BoardModel {
    constructor(level) {
        this.width = level.width;
        this.height = level.height;
        this.walls = level.walls;
        this.targets = level.targets;
        this.floors = level.floors;
        this.player = { ...level.player };
        this.boxes = level.boxes.map(b => ({ ...b }));
        this.history = []; // Each entry: { dx, dy, movedBox: boolean, boxIndex }
    }

    boxAt(x, y) {
        return this.boxes.findIndex(b => b.x === x && b.y === y);
    }

    isWall(x, y) {
        return this.walls.has(cellKey(x, y));
    }

    isTarget(x, y) {
        return this.targets.has(cellKey(x, y));
    }

    /** Try to move the player by (dx, dy). Returns true if the move happened. */
    tryMove(dx, dy) {
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        if (this.isWall(nx, ny)) return false;

        const boxIndex = this.boxAt(nx, ny);
        if (boxIndex >= 0) {
            const bx = nx + dx;
            const by = ny + dy;
            if (this.isWall(bx, by) || this.boxAt(bx, by) >= 0) return false;
            this.boxes[boxIndex] = { x: bx, y: by };
            this.player = { x: nx, y: ny };
            this.history.push({ dx, dy, movedBox: true, boxIndex });
            return true;
        }

        this.player = { x: nx, y: ny };
        this.history.push({ dx, dy, movedBox: false });
        return true;
    }

    /** Undo the last move. Returns true if something was undone. */
    undo() {
        const last = this.history.pop();
        if (!last) return false;
        this.player = { x: this.player.x - last.dx, y: this.player.y - last.dy };
        if (last.movedBox) {
            const b = this.boxes[last.boxIndex];
            this.boxes[last.boxIndex] = { x: b.x - last.dx, y: b.y - last.dy };
        }
        return true;
    }

    /** True when every box sits on a target. */
    isSolved() {
        if (this.boxes.length === 0) return false;
        return this.boxes.every(b => this.isTarget(b.x, b.y));
    }

    get moveCount() {
        return this.history.length;
    }
}
