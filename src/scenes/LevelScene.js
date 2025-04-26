import Phaser from 'phaser';
import game from '../main.js';

class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    preload() {
        // Load any assets needed for the level selection
    }

    create() {
        // Add background
        this.cameras.main.setBackgroundColor('#f0f0f0');

        // Add title text
        const title = this.add.text(
            this.cameras.main.centerX,
            100,
            'SELECT LEVEL',
            {
                fontSize: '48px',
                fill: '#000',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);

        // Add back button
        const backButton = this.add.text(
            100,
            50,
            '< BACK',
            {
                fontSize: '24px',
                fill: '#000',
                backgroundColor: '#f0f0f0',
                padding: { left: 15, right: 15, top: 5, bottom: 5 }
            }
        );
        backButton.setInteractive({ useHandCursor: true });

        // Add hover effect
        backButton.on('pointerover', () => {
            backButton.setStyle({ fill: '#555' });
        });

        backButton.on('pointerout', () => {
            backButton.setStyle({ fill: '#000' });
        });

        // Add click event
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Create level buttons
        this.createLevelButtons();
    }

    createLevelButtons() {
        const buttonWidth = 150;
        const buttonHeight = 100;
        const padding = 20;
        const startX = this.cameras.main.centerX - buttonWidth - padding / 2;
        const startY = this.cameras.main.centerY - buttonHeight / 2;

        for (let i = 0; i < game.globals.totalLevels; i++) {
            const x = startX + (i % 3) * (buttonWidth + padding);
            const y = startY + Math.floor(i / 3) * (buttonHeight + padding);

            // Create button background
            const buttonBg = this.add.rectangle(
                x + buttonWidth / 2,
                y + buttonHeight / 2,
                buttonWidth,
                buttonHeight,
                game.globals.levelCompleted[i] ? 0x4CAF50 : 0x3498db
            );
            buttonBg.setInteractive({ useHandCursor: true });

            // Add level number
            const levelText = this.add.text(
                x + buttonWidth / 2,
                y + buttonHeight / 2,
                `LEVEL ${i + 1}`,
                {
                    fontSize: '24px',
                    fill: '#fff',
                    align: 'center'
                }
            );
            levelText.setOrigin(0.5);

            // Add click event
            buttonBg.on('pointerdown', () => {
                game.globals.currentLevel = i;
                this.scene.start('MainScene');
            });

            // Add hover effect
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(game.globals.levelCompleted[i] ? 0x45a049 : 0x2980b9);
            });

            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(game.globals.levelCompleted[i] ? 0x4CAF50 : 0x3498db);
            });
        }
    }
}
export default LevelScene;
