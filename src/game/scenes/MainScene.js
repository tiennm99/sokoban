import Phaser from 'phaser';
import game from '../main.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });

        // Game objects
        this.player = null;
        this.walls = null;
        this.boxes = null;
        this.targets = null;

        // Controls
        this.cursors = null;
        this.lastKeyPressed = 0; // Add timestamp for key press tracking
        this.keyDelay = 150; // Minimum delay between key presses in milliseconds

        // Level data
        this.levelData = null;

        // Game state
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };

        // Tile size
        this.tileSize = 64;
    }

    init() {
        // Reset all state variables when scene initializes
        this.player = null;
        this.walls = null;
        this.boxes = null;
        this.targets = null;
        this.cursors = null;
        this.isMoving = false;
        this.lastKeyPressed = 0;
        this.levelData = null;
    }

    preload() {
        // Load level data
        this.load.json('level1', 'assets/levels/level1.json');
        this.load.json('level2', 'assets/levels/level2.json');
        this.load.json('level3', 'assets/levels/level3.json');
    }

    create() {
        // Set up controls - using Phaser's built-in cursor keys
        this.cursors = this.input.keyboard.createCursorKeys();

        try {
            // Get game state from registry
            const gameState = this.game.registry.get('gameState');

            // Load level data
            const levelNumber = gameState.currentLevel + 1;
            this.levelData = this.cache.json.get(`level${levelNumber}`);

            if (!this.levelData || !this.levelData.tiles) {
                console.error(`Failed to load level data for level ${levelNumber}`);
                this.showErrorMessage(`Failed to load level ${levelNumber}`);
                return;
            }

            // Create game objects
            this.createLevel();

            // Add UI elements
            this.createUI();
        } catch (error) {
            console.error('Error creating level:', error);
            this.showErrorMessage('Error loading level');
        }
    }

    showErrorMessage(message) {
        // Add error message
        const errorText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            message,
            {
                fontSize: '32px',
                fill: '#FF0000',
                backgroundColor: '#000000',
                padding: { left: 20, right: 20, top: 10, bottom: 10 }
            }
        );
        errorText.setOrigin(0.5);

        // Add back button
        const backButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            'BACK TO MENU',
            {
                fontSize: '24px',
                fill: '#FFFFFF',
                backgroundColor: '#333333',
                padding: { left: 15, right: 15, top: 5, bottom: 5 }
            }
        );
        backButton.setOrigin(0.5);
        backButton.setInteractive({ useHandCursor: true });

        // Add hover effect
        backButton.on('pointerover', () => {
            backButton.setStyle({ backgroundColor: '#555555' });
        });

        backButton.on('pointerout', () => {
            backButton.setStyle({ backgroundColor: '#333333' });
        });

        // Add click event
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    update() {
        // Skip if player is already moving or player is not defined
        if (this.isMoving || !this.player) return;

        const currentTime = Date.now();

        // Only process input if enough time has passed since last key press
        if (currentTime - this.lastKeyPressed >= this.keyDelay) {
            if (this.cursors.left.isDown) {
                this.movePlayer(-1, 0);
                this.lastKeyPressed = currentTime;
            } else if (this.cursors.right.isDown) {
                this.movePlayer(1, 0);
                this.lastKeyPressed = currentTime;
            } else if (this.cursors.up.isDown) {
                this.movePlayer(0, -1);
                this.lastKeyPressed = currentTime;
            } else if (this.cursors.down.isDown) {
                this.movePlayer(0, 1);
                this.lastKeyPressed = currentTime;
            }
        }

        // Check win condition
        this.checkWinCondition();
    }

    createLevel() {
        // Create groups for game objects
        this.walls = this.physics.add.staticGroup();
        this.boxes = this.physics.add.group();
        this.targets = this.physics.add.staticGroup();

        // Calculate level offset to center it
        const levelWidth = this.levelData.width * this.tileSize;
        const levelHeight = this.levelData.height * this.tileSize;
        const offsetX = (this.cameras.main.width - levelWidth) / 2;
        const offsetY = (this.cameras.main.height - levelHeight) / 2;

        // Create floor tiles (light gray background)
        this.add.rectangle(
            offsetX + levelWidth / 2,
            offsetY + levelHeight / 2,
            levelWidth,
            levelHeight,
            0xeeeeee
        );

        // Create grid lines
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xcccccc, 0.5);

        // Draw horizontal grid lines
        for (let y = 0; y <= this.levelData.height; y++) {
            graphics.moveTo(offsetX, offsetY + y * this.tileSize);
            graphics.lineTo(offsetX + levelWidth, offsetY + y * this.tileSize);
        }

        // Draw vertical grid lines
        for (let x = 0; x <= this.levelData.width; x++) {
            graphics.moveTo(offsetX + x * this.tileSize, offsetY);
            graphics.lineTo(offsetX + x * this.tileSize, offsetY + levelHeight);
        }

        graphics.strokePath();

        // Create level objects based on level data
        for (let y = 0; y < this.levelData.height; y++) {
            for (let x = 0; x < this.levelData.width; x++) {
                const tileX = offsetX + x * this.tileSize + this.tileSize / 2;
                const tileY = offsetY + y * this.tileSize + this.tileSize / 2;

                const tile = this.levelData.tiles[y][x];

                switch (tile) {
                    case 'W': // Wall (dark gray rectangle)
                        const wall = this.add.rectangle(tileX, tileY, this.tileSize - 4, this.tileSize - 4, 0x555555);
                        this.walls.add(wall);
                        break;
                    case 'B': // Box (brown rectangle)
                        const box = this.add.rectangle(tileX, tileY, this.tileSize - 10, this.tileSize - 10, 0x8B4513);
                        this.physics.add.existing(box);
                        box.setData('onTarget', false);
                        this.boxes.add(box);
                        break;
                    case 'P': // Player (blue circle)
                        this.player = this.add.circle(tileX, tileY, this.tileSize / 2 - 5, 0x0000FF);
                        this.physics.add.existing(this.player);
                        this.player.setData('gridX', x);
                        this.player.setData('gridY', y);
                        break;
                    case 'T': // Target (red circle outline)
                        const target = this.add.circle(tileX, tileY, this.tileSize / 3, 0xFF0000, 0.2);
                        target.setStrokeStyle(2, 0xFF0000);
                        this.targets.add(target);
                        break;
                    case 'BT': // Box on target (brown rectangle with red outline)
                        const targetBox = this.add.rectangle(tileX, tileY, this.tileSize - 10, this.tileSize - 10, 0x8B4513);
                        targetBox.setStrokeStyle(3, 0xFF0000);
                        this.physics.add.existing(targetBox);
                        targetBox.setData('onTarget', true);
                        this.boxes.add(targetBox);

                        const boxTarget = this.add.circle(tileX, tileY, this.tileSize / 3, 0xFF0000, 0.2);
                        boxTarget.setStrokeStyle(2, 0xFF0000);
                        this.targets.add(boxTarget);
                        break;
                    case '.': // Empty space - do nothing
                        break;
                    default:
                        console.warn(`Unknown tile type: ${tile} at position (${x}, ${y})`);
                        break;
                }
            }
        }

        // Set up collisions
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.boxes, this.walls);
        this.physics.add.collider(this.boxes, this.boxes);
    }

    createUI() {
        // Get game state from registry
        const gameState = this.game.registry.get('gameState');

        // Add level text
        const levelText = this.add.text(
            20,
            20,
            `LEVEL ${gameState.currentLevel + 1}`,
            {
                fontSize: '24px',
                fill: '#000'
            }
        );

        // Add restart button
        const restartButton = this.add.text(
            this.cameras.main.width - 20,
            20,
            'RESTART',
            {
                fontSize: '24px',
                fill: '#000',
                backgroundColor: '#f0f0f0',
                padding: { left: 15, right: 15, top: 5, bottom: 5 }
            }
        );
        restartButton.setOrigin(1, 0);
        restartButton.setInteractive({ useHandCursor: true });

        // Add hover effect
        restartButton.on('pointerover', () => {
            restartButton.setStyle({ fill: '#555' });
        });

        restartButton.on('pointerout', () => {
            restartButton.setStyle({ fill: '#000' });
        });

        // Add click event
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });

        // Add back button
        const backButton = this.add.text(
            20,
            this.cameras.main.height - 20,
            'BACK TO MENU',
            {
                fontSize: '24px',
                fill: '#000',
                backgroundColor: '#f0f0f0',
                padding: { left: 15, right: 15, top: 5, bottom: 5 }
            }
        );
        backButton.setOrigin(0, 1);
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
    }

    movePlayer(dx, dy) {
        // Set moving flag
        this.isMoving = true;

        // Get player's current grid position
        const gridX = this.player.getData('gridX');
        const gridY = this.player.getData('gridY');

        // Calculate new position
        const newX = gridX + dx;
        const newY = gridY + dy;

        // Check if the new position is valid
        if (this.isValidMove(newX, newY, dx, dy)) {
            // Update player's grid position
            this.player.setData('gridX', newX);
            this.player.setData('gridY', newY);

            // Calculate pixel position
            const levelWidth = this.levelData.width * this.tileSize;
            const levelHeight = this.levelData.height * this.tileSize;
            const offsetX = (this.cameras.main.width - levelWidth) / 2;
            const offsetY = (this.cameras.main.height - levelHeight) / 2;

            const pixelX = offsetX + newX * this.tileSize + this.tileSize / 2;
            const pixelY = offsetY + newY * this.tileSize + this.tileSize / 2;

            // Move player
            this.tweens.add({
                targets: this.player,
                x: pixelX,
                y: pixelY,
                duration: 100,
                onComplete: () => {
                    this.isMoving = false;
                }
            });
        } else {
            this.isMoving = false;
        }
    }

    isValidMove(newX, newY, dx, dy) {
        // Check if the new position is out of bounds
        if (newX < 0 || newX >= this.levelData.width || newY < 0 || newY >= this.levelData.height) {
            return false;
        }

        // Calculate level offset
        const levelWidth = this.levelData.width * this.tileSize;
        const levelHeight = this.levelData.height * this.tileSize;
        const offsetX = (this.cameras.main.width - levelWidth) / 2;
        const offsetY = (this.cameras.main.height - levelHeight) / 2;

        // Calculate pixel position
        const pixelX = offsetX + newX * this.tileSize + this.tileSize / 2;
        const pixelY = offsetY + newY * this.tileSize + this.tileSize / 2;

        // Check if there's a wall at the new position
        let wallAtPosition = false;
        this.walls.getChildren().forEach(wall => {
            if (wall.x === pixelX && wall.y === pixelY) {
                wallAtPosition = true;
            }
        });

        if (wallAtPosition) {
            return false;
        }

        // Check if there's a box at the new position
        let boxAtPosition = null;
        this.boxes.getChildren().forEach(box => {
            if (box.x === pixelX && box.y === pixelY) {
                boxAtPosition = box;
            }
        });

        if (boxAtPosition) {
            // Calculate the position behind the box
            const behindX = newX + dx;
            const behindY = newY + dy;

            // Check if the position behind the box is valid
            if (this.isValidBoxMove(behindX, behindY)) {
                // Calculate pixel position behind the box
                const behindPixelX = offsetX + behindX * this.tileSize + this.tileSize / 2;
                const behindPixelY = offsetY + behindY * this.tileSize + this.tileSize / 2;

                // Move the box
                this.tweens.add({
                    targets: boxAtPosition,
                    x: behindPixelX,
                    y: behindPixelY,
                    duration: 100,
                    onComplete: () => {
                        // Check if the box is on a target
                        let onTarget = false;
                        this.targets.getChildren().forEach(target => {
                            if (target.x === behindPixelX && target.y === behindPixelY) {
                                onTarget = true;
                            }
                        });

                        // Update box appearance
                        if (onTarget) {
                            boxAtPosition.setStrokeStyle(3, 0xFF0000);
                            boxAtPosition.setData('onTarget', true);
                        } else {
                            boxAtPosition.setStrokeStyle(0);
                            boxAtPosition.setData('onTarget', false);
                        }
                    }
                });

                return true;
            } else {
                return false;
            }
        }

        return true;
    }

    isValidBoxMove(x, y) {
        // Check if the position is out of bounds
        if (x < 0 || x >= this.levelData.width || y < 0 || y >= this.levelData.height) {
            return false;
        }

        // Calculate level offset
        const levelWidth = this.levelData.width * this.tileSize;
        const levelHeight = this.levelData.height * this.tileSize;
        const offsetX = (this.cameras.main.width - levelWidth) / 2;
        const offsetY = (this.cameras.main.height - levelHeight) / 2;

        // Calculate pixel position
        const pixelX = offsetX + x * this.tileSize + this.tileSize / 2;
        const pixelY = offsetY + y * this.tileSize + this.tileSize / 2;

        // Check if there's a wall at the position
        let wallAtPosition = false;
        this.walls.getChildren().forEach(wall => {
            if (wall.x === pixelX && wall.y === pixelY) {
                wallAtPosition = true;
            }
        });

        if (wallAtPosition) {
            return false;
        }

        // Check if there's a box at the position
        let boxAtPosition = false;
        this.boxes.getChildren().forEach(box => {
            if (box.x === pixelX && box.y === pixelY) {
                boxAtPosition = true;
            }
        });

        if (boxAtPosition) {
            return false;
        }

        return true;
    }

    checkWinCondition() {
        // Check if all boxes are on targets
        let allBoxesOnTargets = true;

        this.boxes.getChildren().forEach(box => {
            if (!box.getData('onTarget')) {
                allBoxesOnTargets = false;
            }
        });

        if (allBoxesOnTargets && this.boxes.getChildren().length > 0) {
            // Get current game state and update function from registry
            const gameState = this.game.registry.get('gameState');
            const updateGameState = this.game.registry.get('updateGameState');

            // Create new levelCompleted array with current level marked as completed
            const levelCompleted = [...gameState.levelCompleted];
            levelCompleted[gameState.currentLevel] = true;

            // Update the game state
            updateGameState({ levelCompleted });

            // Show win message
            const winText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                'LEVEL COMPLETE!',
                {
                    fontSize: '48px',
                    fill: '#000',
                    backgroundColor: '#4CAF50',
                    padding: { left: 30, right: 30, top: 15, bottom: 15 }
                }
            );
            winText.setOrigin(0.5);

            // Add continue button
            const continueButton = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY + 100,
                'CONTINUE',
                {
                    fontSize: '32px',
                    fill: '#000',
                    backgroundColor: '#f0f0f0',
                    padding: { left: 20, right: 20, top: 10, bottom: 10 }
                }
            );
            continueButton.setOrigin(0.5);
            continueButton.setInteractive({ useHandCursor: true });

            // Add hover effect
            continueButton.on('pointerover', () => {
                continueButton.setStyle({ fill: '#555' });
            });

            continueButton.on('pointerout', () => {
                continueButton.setStyle({ fill: '#000' });
            });

            // Add click event
            continueButton.on('pointerdown', () => {
                this.scene.start('LevelScene');
            });

            // Disable player movement
            this.isMoving = true;
        }
    }

    shutdown() {
        // Clean up physics
        if (this.physics && this.physics.world) {
            this.physics.world.shutdown();
        }

        // Destroy all game objects
        if (this.player) this.player.destroy();
        if (this.walls) this.walls.destroy(true);
        if (this.boxes) this.boxes.destroy(true);
        if (this.targets) this.targets.destroy(true);

        // Reset all state variables
        this.player = null;
        this.walls = null;
        this.boxes = null;
        this.targets = null;
        this.cursors = null;
        this.isMoving = false;
        this.lastKeyPressed = 0;
        this.levelData = null;

        // Remove all input listeners
        this.input.keyboard.removeAllKeys(true);
        this.input.keyboard.removeAllListeners();
    }

    destroy() {
        this.shutdown();
        super.destroy();
    }
}
export default MainScene;
