import { AUTO, Game } from 'phaser';
import MenuScene from './scenes/MenuScene';
import LevelScene from './scenes/LevelScene';
import MainScene from './scenes/MainScene';

const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: [MenuScene, LevelScene, MainScene],
};

class GameManager extends Game {
    constructor(config) {
        super(config);

        // Initialize game state in registry
        this.registry.set('gameState', {
            currentLevel: 0,
            totalLevels: 3,
            levelCompleted: [false, false, false]
        });

        // Add methods to manage game state
        this.registry.set('updateGameState', (updates) => {
            const currentState = this.registry.get('gameState');
            const newState = { ...currentState, ...updates };
            this.registry.set('gameState', newState);
            return newState;
        });
    }
}

const StartGame = (parent) => {
    return new GameManager({ ...config, parent });
};

export default StartGame;
