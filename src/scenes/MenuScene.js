import Phaser from 'phaser';
import { getAssetPath } from '../utils/assetUtils.js';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // No assets to preload
    }

    create() {
        // Add background
        this.cameras.main.setBackgroundColor('#f0f0f0');

        // Add title text
        const title = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'SOKOBAN',
            {
                fontSize: '64px',
                fill: '#000',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);

        // Add play button
        const playButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'PLAY',
            {
                fontSize: '32px',
                fill: '#000',
                backgroundColor: '#4CAF50',
                padding: { left: 30, right: 30, top: 10, bottom: 10 }
            }
        );
        playButton.setOrigin(0.5);
        playButton.setInteractive({ useHandCursor: true });

        // Add hover effect
        playButton.on('pointerover', () => {
            playButton.setStyle({ fill: '#fff' });
        });

        playButton.on('pointerout', () => {
            playButton.setStyle({ fill: '#000' });
        });

        // Add click event
        playButton.on('pointerdown', () => {
            this.scene.start('LevelScene');
        });

        // Add instructions
        const instructions = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'Use arrow keys to move\nPush boxes to the targets',
            {
                fontSize: '24px',
                fill: '#000',
                align: 'center'
            }
        );
        instructions.setOrigin(0.5);
    }
}
export default MenuScene;
