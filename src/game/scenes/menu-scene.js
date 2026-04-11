/**
 * Menu scene: title, play button, progress counter, keybind hints.
 */

import Phaser from 'phaser';
import { COLORS, FONTS } from '../core/theme.js';
import { createButton } from '../ui/button-factory.js';
import { progressStore } from '../core/progress-store.js';
import { MICROBAN_LEVELS } from '../data/microban-levels.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this.cameras.main.setBackgroundColor(COLORS.bgCss);
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.add.text(cx, cy - 200, 'SOKOBAN', FONTS.title).setOrigin(0.5);
        this.add.text(cx, cy - 130, '100 puzzles to solve', FONTS.subtitle).setOrigin(0.5);

        createButton(this, cx, cy - 20, 'PLAY', () => this.scene.start('LevelScene'), { width: 240, height: 64 });

        const completed = progressStore.getCompletedCount();
        this.add.text(cx, cy + 60, `Completed: ${completed} / ${MICROBAN_LEVELS.length}`, FONTS.label).setOrigin(0.5);

        const hints = [
            'Arrow keys / WASD — move',
            'U or Z — undo      R — restart      Esc — menu',
            'Push every box onto a target tile'
        ].join('\n');
        this.add.text(cx, cy + 170, hints, { ...FONTS.small, align: 'center' }).setOrigin(0.5);

        this.add.text(cx, this.cameras.main.height - 24, 'Level layouts from Microban by David W. Skinner', FONTS.small).setOrigin(0.5);
    }
}
