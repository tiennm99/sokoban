/**
 * Board renderer: takes a BoardModel and draws it inside a Phaser scene.
 * Owns the visual objects (walls, floors, targets, boxes, player) and
 * provides animated update hooks called after every move.
 */

import { COLORS } from '../core/theme.js';
import { cellKey } from '../core/level-parser.js';

export class BoardRenderer {
    constructor(scene, model, tileSize, offset) {
        this.scene = scene;
        this.model = model;
        this.tileSize = tileSize;
        this.offset = offset;
        this.boxSprites = [];
        this.playerSprite = null;
    }

    cellToPixel(x, y) {
        return {
            px: this.offset.x + x * this.tileSize + this.tileSize / 2,
            py: this.offset.y + y * this.tileSize + this.tileSize / 2
        };
    }

    renderStatic() {
        const s = this.tileSize;
        const g = this.scene.add.graphics();

        // Floor tiles (only flood-filled interior)
        for (const k of this.model.floors) {
            const [x, y] = k.split(',').map(Number);
            const { px, py } = this.cellToPixel(x, y);
            const isAlt = (x + y) % 2 === 0;
            g.fillStyle(isAlt ? COLORS.floor : COLORS.floorAlt, 1);
            g.fillRect(px - s / 2, py - s / 2, s, s);
        }

        // Walls — draw only walls adjacent to a floor tile (skip the dead outer border)
        for (const k of this.model.walls) {
            const [x, y] = k.split(',').map(Number);
            if (!this.wallTouchesFloor(x, y)) continue;
            const { px, py } = this.cellToPixel(x, y);
            g.fillStyle(COLORS.wall, 1);
            g.fillRoundedRect(px - s / 2 + 2, py - s / 2 + 2, s - 4, s - 4, 6);
            g.lineStyle(2, COLORS.wallEdge, 1);
            g.strokeRoundedRect(px - s / 2 + 2, py - s / 2 + 2, s - 4, s - 4, 6);
        }

        // Targets (rendered as glowing diamonds so they show under boxes too)
        for (const k of this.model.targets) {
            const [x, y] = k.split(',').map(Number);
            const { px, py } = this.cellToPixel(x, y);
            g.lineStyle(2, COLORS.target, 0.9);
            g.strokeCircle(px, py, s / 4);
            g.fillStyle(COLORS.target, 0.2);
            g.fillCircle(px, py, s / 4);
        }
    }

    wallTouchesFloor(x, y) {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
        return dirs.some(([dx, dy]) => this.model.floors.has(cellKey(x + dx, y + dy)));
    }

    renderEntities() {
        const s = this.tileSize;

        // Boxes
        this.boxSprites = this.model.boxes.map((box) => {
            const { px, py } = this.cellToPixel(box.x, box.y);
            const rect = this.scene.add.rectangle(px, py, s - 10, s - 10, COLORS.box);
            rect.setStrokeStyle(3, COLORS.boxEdge);
            return rect;
        });
        this.refreshBoxStates();

        // Player
        const { px, py } = this.cellToPixel(this.model.player.x, this.model.player.y);
        this.playerSprite = this.scene.add.circle(px, py, s / 2 - 6, COLORS.player);
        this.playerSprite.setStrokeStyle(3, COLORS.playerEdge);
    }

    refreshBoxStates() {
        this.model.boxes.forEach((box, i) => {
            const sprite = this.boxSprites[i];
            const onTarget = this.model.isTarget(box.x, box.y);
            sprite.setFillStyle(onTarget ? COLORS.boxDone : COLORS.box);
            sprite.setStrokeStyle(3, onTarget ? COLORS.boxDoneEdge : COLORS.boxEdge);
        });
    }

    animateMove(duration = 110) {
        const { px: ppx, py: ppy } = this.cellToPixel(this.model.player.x, this.model.player.y);
        this.scene.tweens.add({ targets: this.playerSprite, x: ppx, y: ppy, duration });
        this.model.boxes.forEach((box, i) => {
            const sprite = this.boxSprites[i];
            const { px, py } = this.cellToPixel(box.x, box.y);
            if (sprite.x !== px || sprite.y !== py) {
                this.scene.tweens.add({
                    targets: sprite, x: px, y: py, duration,
                    onComplete: () => this.refreshBoxStates()
                });
            }
        });
        this.refreshBoxStates();
    }
}
