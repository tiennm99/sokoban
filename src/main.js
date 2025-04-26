import {Game, AUTO} from 'phaser';
import MenuScene from './scenes/MenuScene';
import LevelScene from './scenes/LevelScene';
import MainScene from './scenes/MainScene';

// Game configuration
const config = {
    type: AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#f9f9f9',
    scene: [MenuScene, LevelScene, MainScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false
        }
    },
    pixelArt: true
};

// Create the game instance
const game = new Game(config);

// Global game variables
game.globals = {
    currentLevel: 0,
    totalLevels: 3, // We'll create 3 levels for now
    levelCompleted: [false, false, false]
};

export default game;
