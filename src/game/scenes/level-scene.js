/**
 * Level select scene: paginated grid of 100 levels.
 * 5x4 = 20 per page × 5 pages. Completed levels show a checkmark + best move count.
 */

import Phaser from 'phaser';
import { COLORS, FONTS } from '../core/theme.js';
import { createButton, createIconButton } from '../ui/button-factory.js';
import { progressStore } from '../core/progress-store.js';
import { MICROBAN_LEVELS } from '../data/microban-levels.js';

const COLS = 5;
const ROWS = 4;
const PER_PAGE = COLS * ROWS;

export default class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
        this.page = 0;
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgCss);
        this.totalPages = Math.ceil(MICROBAN_LEVELS.length / PER_PAGE);
        this.pageGroup = this.add.container(0, 0);

        this.add.text(this.cameras.main.centerX, 60, 'SELECT LEVEL', FONTS.title).setOrigin(0.5).setScale(0.6);

        createButton(this, 110, 60, '< BACK', () => this.scene.start('MenuScene'), { width: 140, height: 44 });

        this.pageLabel = this.add.text(this.cameras.main.centerX, this.cameras.main.height - 90, '', FONTS.label).setOrigin(0.5);

        createIconButton(this, this.cameras.main.centerX - 100, this.cameras.main.height - 90, '<', () => this.changePage(-1));
        createIconButton(this, this.cameras.main.centerX + 100, this.cameras.main.height - 90, '>', () => this.changePage(1));

        const completed = progressStore.getCompletedCount();
        this.add.text(this.cameras.main.width - 20, 60, `${completed}/${MICROBAN_LEVELS.length}`, FONTS.label).setOrigin(1, 0.5);

        this.renderPage();
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
        this.input.keyboard.on('keydown-LEFT', () => this.changePage(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.changePage(1));
    }

    changePage(delta) {
        const next = Phaser.Math.Clamp(this.page + delta, 0, this.totalPages - 1);
        if (next === this.page) return;
        this.page = next;
        this.renderPage();
    }

    renderPage() {
        this.pageGroup.removeAll(true);
        this.pageLabel.setText(`Page ${this.page + 1} / ${this.totalPages}`);

        const buttonW = 140;
        const buttonH = 90;
        const padX = 24;
        const padY = 18;
        const gridWidth = COLS * buttonW + (COLS - 1) * padX;
        const gridHeight = ROWS * buttonH + (ROWS - 1) * padY;
        const startX = (this.cameras.main.width - gridWidth) / 2 + buttonW / 2;
        const startY = 180;

        const startIndex = this.page * PER_PAGE;
        for (let i = 0; i < PER_PAGE; i++) {
            const levelIndex = startIndex + i;
            if (levelIndex >= MICROBAN_LEVELS.length) break;
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = startX + col * (buttonW + padX);
            const y = startY + row * (buttonH + padY);
            this.pageGroup.add(this.makeLevelButton(x, y, levelIndex, buttonW, buttonH));
        }
    }

    makeLevelButton(x, y, levelIndex, width, height) {
        const done = progressStore.isCompleted(levelIndex);
        const best = progressStore.getBestMoves(levelIndex);
        const fill = done ? 0x3B5A3B : COLORS.panel;
        const hoverFill = done ? 0x4D7A4D : COLORS.panelHover;

        const btn = createButton(this, x, y, '', () => {
            this.game.registry.set('currentLevel', levelIndex);
            this.scene.start('GameScene');
        }, { width, height, fill, hoverFill });

        const label = `${done ? '✓ ' : ''}LEVEL ${levelIndex + 1}`;
        btn.list[1].setText(label);
        btn.list[1].setStyle({ ...FONTS.button, fontSize: '20px' });
        btn.list[1].setY(-12);

        const sub = this.add.text(0, 20, best != null ? `Best: ${best}` : 'Not played', FONTS.small).setOrigin(0.5);
        btn.add(sub);
        return btn;
    }
}
