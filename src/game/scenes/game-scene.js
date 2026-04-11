/**
 * Game scene: parses the active level, builds board model + renderer,
 * wires input (arrows/WASD/undo/restart/esc), shows HUD + win overlay.
 */

import Phaser from 'phaser';
import { COLORS, FONTS, computeTileSize } from '../core/theme.js';
import { parseLevel } from '../core/level-parser.js';
import { BoardModel } from '../core/board-model.js';
import { BoardRenderer } from '../ui/board-renderer.js';
import { createButton } from '../ui/button-factory.js';
import { progressStore } from '../core/progress-store.js';
import { MICROBAN_LEVELS } from '../data/microban-levels.js';

const KEY_REPEAT_MS = 130;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.model = null;
        this.renderer = null;
        this.lastKeyAt = 0;
        this.won = false;
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgCss);
        const levelIndex = this.game.registry.get('currentLevel') ?? 0;
        const xsb = MICROBAN_LEVELS[levelIndex];

        try {
            const level = parseLevel(xsb);
            if (!level.player) throw new Error('Level has no player tile');
            this.model = new BoardModel(level);

            const tileSize = computeTileSize(level.width, level.height, this.cameras.main.width, this.cameras.main.height);
            const offsetX = (this.cameras.main.width - level.width * tileSize) / 2;
            const offsetY = (this.cameras.main.height - level.height * tileSize) / 2 + 20;

            this.renderer = new BoardRenderer(this, this.model, tileSize, { x: offsetX, y: offsetY });
            this.renderer.renderStatic();
            this.renderer.renderEntities();
        } catch (err) {
            console.error('Failed to load level', levelIndex + 1, err);
            this.showError(`Failed to load level ${levelIndex + 1}`);
            return;
        }

        this.buildHud(levelIndex);
        this.bindInput();
    }

    buildHud(levelIndex) {
        this.add.text(24, 20, `LEVEL ${levelIndex + 1}`, FONTS.button);
        this.moveLabel = this.add.text(24, 56, 'Moves: 0', FONTS.label);

        const best = progressStore.getBestMoves(levelIndex);
        if (best != null) {
            this.add.text(24, 86, `Best: ${best}`, FONTS.small);
        }

        const right = this.cameras.main.width - 24;
        createButton(this, right - 80, 44, 'RESTART', () => this.scene.restart(), { width: 140, height: 44 });
        createButton(this, right - 240, 44, 'UNDO', () => this.handleUndo(), { width: 120, height: 44 });
        createButton(this, 100, this.cameras.main.height - 40, '< MENU', () => this.scene.start('MenuScene'), { width: 160, height: 44 });
    }

    bindInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            U: Phaser.Input.Keyboard.KeyCodes.U,
            Z: Phaser.Input.Keyboard.KeyCodes.Z,
            R: Phaser.Input.Keyboard.KeyCodes.R,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });

        this.input.keyboard.on('keydown-U', () => this.handleUndo());
        this.input.keyboard.on('keydown-Z', () => this.handleUndo());
        this.input.keyboard.on('keydown-R', () => this.scene.restart());
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('LevelScene'));
    }

    update(time) {
        if (this.won || !this.model) return;
        if (time - this.lastKeyAt < KEY_REPEAT_MS) return;

        let dx = 0, dy = 0;
        if (this.cursors.left.isDown || this.keys.A.isDown) dx = -1;
        else if (this.cursors.right.isDown || this.keys.D.isDown) dx = 1;
        else if (this.cursors.up.isDown || this.keys.W.isDown) dy = -1;
        else if (this.cursors.down.isDown || this.keys.S.isDown) dy = 1;

        if (dx === 0 && dy === 0) return;

        if (this.model.tryMove(dx, dy)) {
            this.lastKeyAt = time;
            this.renderer.animateMove();
            this.moveLabel.setText(`Moves: ${this.model.moveCount}`);
            if (this.model.isSolved()) this.onWin();
        } else {
            this.lastKeyAt = time;
        }
    }

    handleUndo() {
        if (this.won || !this.model) return;
        if (this.model.undo()) {
            this.renderer.animateMove();
            this.moveLabel.setText(`Moves: ${this.model.moveCount}`);
        }
    }

    onWin() {
        this.won = true;
        const levelIndex = this.game.registry.get('currentLevel') ?? 0;
        progressStore.recordCompletion(levelIndex, this.model.moveCount);

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        const overlay = this.add.rectangle(cx, cy, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6);
        overlay.setDepth(10);

        const panel = this.add.rectangle(cx, cy, 420, 260, COLORS.panel).setDepth(10);
        panel.setStrokeStyle(3, COLORS.player);

        this.add.text(cx, cy - 70, 'LEVEL COMPLETE!', { ...FONTS.title, fontSize: '32px', color: COLORS.textPrimary }).setOrigin(0.5).setDepth(11);
        this.add.text(cx, cy - 20, `Moves: ${this.model.moveCount}`, FONTS.label).setOrigin(0.5).setDepth(11);

        const hasNext = levelIndex + 1 < MICROBAN_LEVELS.length;
        if (hasNext) {
            createButton(this, cx - 90, cy + 60, 'NEXT', () => {
                this.game.registry.set('currentLevel', levelIndex + 1);
                this.scene.restart();
            }, { width: 150, height: 48 }).setDepth(11);
        }
        createButton(this, cx + (hasNext ? 90 : 0), cy + 60, 'LEVELS', () => this.scene.start('LevelScene'), { width: 150, height: 48 }).setDepth(11);
    }

    showError(message) {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        this.add.text(cx, cy - 40, message, { ...FONTS.label, color: COLORS.danger }).setOrigin(0.5);
        createButton(this, cx, cy + 40, 'BACK TO MENU', () => this.scene.start('MenuScene'), { width: 220, height: 48 });
    }
}
